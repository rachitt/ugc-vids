export type ScrapedBrandPage = {
  label: "home" | "pricing" | "about";
  url: string;
  title: string | null;
  description: string | null;
  text: string;
  status: number;
};

export type BrandWebsiteScrape = {
  rootUrl: string;
  pages: ScrapedBrandPage[];
  summary: string;
  logoUrl: string | null;
  colors: Record<string, string>;
};

type FetchPageResult = {
  html: string;
  status: number;
  url: string;
};

type CompanionLinks = Record<"pricing" | "about", string[]>;

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_CHARS = 1_500_000;
const MAX_PAGE_TEXT_CHARS = 6_000;
const MAX_SUMMARY_CHARS = 14_000;

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a website URL.");
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid http or https URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  url.hash = "";

  return url.toString();
}

export async function scrapeBrandWebsite(
  rawUrl: string,
): Promise<BrandWebsiteScrape> {
  const rootUrl = normalizeWebsiteUrl(rawUrl);

  if (process.env.FASTLANE_FAKE_SCRAPE === "1") {
    return buildFakeBrandWebsiteScrape(rootUrl);
  }

  const homeFetch = await fetchHtml(rootUrl, true);

  if (!homeFetch) {
    throw new Error("Could not fetch the landing page.");
  }

  const homePage = extractPage(homeFetch, "home");
  const companions = extractCompanionLinks(homeFetch.html, homeFetch.url);
  const pages: ScrapedBrandPage[] = [homePage];
  const fetchedKeys = new Set([getUrlKey(homeFetch.url)]);

  for (const label of ["pricing", "about"] as const) {
    const companionPage = await fetchFirstPresentPage(
      label,
      homeFetch.url,
      companions[label],
      fetchedKeys,
    );

    if (companionPage) {
      pages.push(companionPage);
      fetchedKeys.add(getUrlKey(companionPage.url));
    }
  }

  return {
    rootUrl: homePage.url,
    pages,
    summary: buildScrapedSummary(pages),
    logoUrl: extractLogoUrl(homeFetch.html, homeFetch.url),
    colors: extractColors(homeFetch.html),
  };
}

function buildFakeBrandWebsiteScrape(rootUrl: string): BrandWebsiteScrape {
  const base = new URL(rootUrl);
  const pricingUrl = new URL("/pricing", base.origin).toString();
  const aboutUrl = new URL("/about", base.origin).toString();
  const pages: ScrapedBrandPage[] = [
    {
      label: "home",
      url: rootUrl,
      title: "Fastlane Creative OS",
      description:
        "Turn website proof into short-form UGC scripts, saved winners, rendered videos, and scheduled posts.",
      text: [
        "Fastlane Creative OS helps lean marketing teams convert existing website messaging into practical UGC creative.",
        "Paste a URL, generate a brand profile, review short-form concepts in Blitz, and save the winners for rendering.",
        "The product keeps scripts, captions, hashtags, renders, and publishing slots in one workflow.",
      ].join("\n"),
      status: 200,
    },
    {
      label: "pricing",
      url: pricingUrl,
      title: "Simple plans for creative teams",
      description:
        "Plans are built around saved content capacity, rendering workflows, and team review volume.",
      text: [
        "Starter teams need quick script generation, review, and local export for campaigns.",
        "Growth teams need more saved ideas, faster approval, and a calendar for platform-specific posting.",
      ].join("\n"),
      status: 200,
    },
    {
      label: "about",
      url: aboutUrl,
      title: "Built for creative velocity",
      description:
        "Fastlane is built for operators who want specific, proof-led content instead of generic AI output.",
      text: [
        "The team believes great short-form content starts with real product proof and customer language.",
        "Fastlane connects intake, generation, review, rendering, scheduling, and export so the loop stays visible.",
      ].join("\n"),
      status: 200,
    },
  ];

  return {
    rootUrl,
    pages,
    summary: buildScrapedSummary(pages),
    logoUrl: null,
    colors: {
      accent: "#2563eb",
      foreground: "#111827",
      secondary: "#10b981",
    },
  };
}

async function fetchFirstPresentPage(
  label: "pricing" | "about",
  baseUrl: string,
  discoveredUrls: string[],
  fetchedKeys: Set<string>,
) {
  const base = new URL(baseUrl);
  const directUrl = new URL(`/${label}`, base.origin).toString();
  const candidates = uniqueStrings([...discoveredUrls, directUrl]);

  for (const candidate of candidates) {
    if (fetchedKeys.has(getUrlKey(candidate))) {
      continue;
    }

    const fetched = await fetchHtml(candidate, false);

    if (fetched && !fetchedKeys.has(getUrlKey(fetched.url))) {
      return extractPage(fetched, label);
    }
  }

  return null;
}

async function fetchHtml(url: string, required: boolean) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "FastlaneBrandProfileBot/0.1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (required) {
        throw new Error(`Request failed with ${response.status}.`);
      }

      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      if (required) {
        throw new Error("The URL did not return an HTML page.");
      }

      return null;
    }

    const html = await response.text();

    return {
      html: html.slice(0, MAX_HTML_CHARS),
      status: response.status,
      url: response.url || url,
    } satisfies FetchPageResult;
  } catch (error) {
    if (required) {
      throw error;
    }

    return null;
  }
}

function extractPage(
  fetched: FetchPageResult,
  label: ScrapedBrandPage["label"],
): ScrapedBrandPage {
  const title = extractTitle(fetched.html);
  const description = extractDescription(fetched.html);
  const text = extractReadableText(fetched.html, title, description);

  return {
    label,
    url: fetched.url,
    title,
    description,
    text,
    status: fetched.status,
  };
}

function extractReadableText(
  html: string,
  title: string | null,
  description: string | null,
) {
  const cleanHtml = stripUnhelpfulHtml(html);
  const container = selectReadableContainer(cleanHtml);
  const blocks = extractScoredBlocks(container);
  const blockText =
    blocks.length > 0
      ? blocks.map((block) => block.text).join("\n")
      : htmlToText(container);
  const chunks = uniqueStrings(
    [title, description, blockText].filter((chunk): chunk is string =>
      Boolean(chunk),
    ),
  );

  return truncateText(chunks.join("\n\n"), MAX_PAGE_TEXT_CHARS);
}

function stripUnhelpfulHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form\b[\s\S]*?<\/form>/gi, " ")
    .replace(
      /<([a-z0-9]+)\b(?=[^>]*(?:id|class)=["'][^"']*(?:cookie|modal|popup|newsletter)[^"']*["'])[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    );
}

function selectReadableContainer(html: string) {
  const mainMatch =
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ??
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);

  return mainMatch?.[1] ?? html;
}

function extractScoredBlocks(html: string) {
  const blockPattern =
    /<(h1|h2|h3|p|li|blockquote|figcaption|td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const seen = new Set<string>();
  const blocks: Array<{ text: string; score: number; index: number }> = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = blockPattern.exec(html))) {
    const tagName = match[1].toLowerCase();
    const text = htmlToText(match[2]);
    const normalizedKey = text.toLowerCase();

    if (
      normalizedKey.length < 12 ||
      seen.has(normalizedKey) ||
      isMostlyBoilerplate(text)
    ) {
      index += 1;
      continue;
    }

    seen.add(normalizedKey);
    blocks.push({
      index,
      score: scoreTextBlock(tagName, text),
      text,
    });
    index += 1;
  }

  return blocks
    .filter((block) => block.score >= 18)
    .sort((a, b) => a.index - b.index)
    .slice(0, 80);
}

function scoreTextBlock(tagName: string, text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const punctuation = (text.match(/[.,;:!?]/g) ?? []).length;
  const tagScore = tagName.startsWith("h") ? 18 : tagName === "li" ? 6 : 10;

  return words + punctuation * 2 + tagScore;
}

function isMostlyBoilerplate(text: string) {
  const boilerplateTerms = [
    "accept cookies",
    "all rights reserved",
    "privacy policy",
    "terms of service",
    "subscribe to our newsletter",
    "skip to content",
  ];
  const normalized = text.toLowerCase();

  return boilerplateTerms.some((term) => normalized.includes(term));
}

function extractCompanionLinks(html: string, baseUrl: string): CompanionLinks {
  const links: CompanionLinks = {
    about: [],
    pricing: [],
  };
  const base = new URL(baseUrl);
  const anchorPattern = /<a\b[^>]*href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html))) {
    const href = stripQuotes(match[1]);
    const absoluteUrl = resolveUrl(decodeHtml(href), baseUrl);

    if (!absoluteUrl) {
      continue;
    }

    const candidate = new URL(absoluteUrl);

    if (candidate.origin !== base.origin) {
      continue;
    }

    const path = candidate.pathname.toLowerCase().replace(/\/+$/, "") || "/";

    if (path === "/pricing" || path.endsWith("/pricing")) {
      links.pricing.push(candidate.toString());
    }

    if (path === "/about" || path.endsWith("/about")) {
      links.about.push(candidate.toString());
    }
  }

  return {
    about: uniqueStrings(links.about),
    pricing: uniqueStrings(links.pricing),
  };
}

function extractTitle(html: string) {
  return (
    extractTagText(html, "title") ??
    extractMetaContent(html, "property", "og:title") ??
    extractTagText(html, "h1")
  );
}

function extractDescription(html: string) {
  return (
    extractMetaContent(html, "name", "description") ??
    extractMetaContent(html, "property", "og:description")
  );
}

function extractTagText(html: string, tagName: string) {
  const match = html.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );

  return match ? normalizeText(decodeHtml(stripTags(match[1]))) : null;
}

function extractMetaContent(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    if (
      getAttribute(tag, attributeName)?.toLowerCase() ===
      attributeValue.toLowerCase()
    ) {
      const content = getAttribute(tag, "content");

      return content ? normalizeText(decodeHtml(content)) : null;
    }
  }

  return null;
}

function extractLogoUrl(html: string, baseUrl: string) {
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];

  for (const tag of imageTags) {
    const descriptor = `${getAttribute(tag, "alt") ?? ""} ${
      getAttribute(tag, "class") ?? ""
    } ${getAttribute(tag, "id") ?? ""}`.toLowerCase();

    if (!descriptor.includes("logo")) {
      continue;
    }

    const source =
      getAttribute(tag, "src") ??
      getAttribute(tag, "data-src") ??
      getAttribute(tag, "data-lazy-src");

    if (!source) {
      continue;
    }

    const absoluteUrl = resolveUrl(decodeHtml(source), baseUrl);

    if (absoluteUrl) {
      return absoluteUrl;
    }
  }

  const ogImage = extractMetaContent(html, "property", "og:image");

  return ogImage ? resolveUrl(ogImage, baseUrl) : null;
}

function extractColors(html: string) {
  const colors: Record<string, string> = {};
  const themeColor = extractMetaContent(html, "name", "theme-color");

  if (themeColor && isHexColor(themeColor)) {
    colors.theme = normalizeHexColor(themeColor);
  }

  const counts = new Map<string, number>();

  for (const match of html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    const color = normalizeHexColor(match);
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([color], index) => {
      if (!Object.values(colors).includes(color)) {
        colors[`palette${index + 1}`] = color;
      }
    });

  return colors;
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s"'>]+)`, "i"),
  );

  return match ? decodeHtml(stripQuotes(match[1])) : undefined;
}

function resolveUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function getUrlKey(value: string) {
  const url = new URL(value);
  url.hash = "";

  return url.toString().replace(/\/+$/, "");
}

function htmlToText(html: string) {
  return normalizeText(
    decodeHtml(
      stripTags(
        html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/(p|div|section|article|li|h[1-6]|tr)>/gi, "\n"),
      ),
    ),
  );
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, "");
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    ldquo: '"',
    lsquo: "'",
    nbsp: " ",
    quot: '"',
    rdquo: '"',
    rsquo: "'",
    lt: "<",
  };

  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return namedEntities[entity] ?? `&${entity};`;
  });
}

function normalizeText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function buildScrapedSummary(pages: ScrapedBrandPage[]) {
  return truncateText(
    pages
      .map((page) =>
        [`[${page.label.toUpperCase()}] ${page.url}`, page.text]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n"),
    MAX_SUMMARY_CHARS,
  );
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(value.trim());
}

function normalizeHexColor(value: string) {
  const hex = value.trim().toLowerCase();

  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  return hex;
}
