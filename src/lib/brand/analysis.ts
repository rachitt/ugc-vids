import { runClaudeAgentTask } from "@/lib/ai/agent";
import type { BrandWebsiteScrape, ScrapedBrandPage } from "@/lib/brand/scraper";

export type BrandProfileAnalysis = {
  productDescription: string;
  audience: string;
  tone: string;
  painPoints: string[];
  nicheTags: string[];
  hookAngles: string[];
};

const BRAND_PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "productDescription",
    "audience",
    "tone",
    "painPoints",
    "nicheTags",
    "hookAngles",
  ],
  properties: {
    productDescription: {
      type: "string",
      minLength: 40,
      description:
        "A concrete two to four sentence description of the product or service.",
    },
    audience: {
      type: "string",
      minLength: 30,
      description:
        "The ideal customer profile, including buyer/user roles and context.",
    },
    tone: {
      type: "string",
      minLength: 10,
      description:
        "The brand voice to use when creating short-form UGC content.",
    },
    painPoints: {
      type: "array",
      minItems: 4,
      maxItems: 12,
      items: {
        type: "string",
        minLength: 8,
      },
    },
    nicheTags: {
      type: "array",
      minItems: 4,
      maxItems: 14,
      items: {
        type: "string",
        minLength: 2,
      },
    },
    hookAngles: {
      type: "array",
      minItems: 20,
      maxItems: 30,
      items: {
        type: "string",
        minLength: 10,
      },
    },
  },
} satisfies Record<string, unknown>;

const SYSTEM_PROMPT = [
  "You are a senior UGC strategist for short-form social ads.",
  "Analyze scraped website copy and return a practical brand profile for a content-generation engine.",
  "Use only facts supported by the provided website text. If something is implicit, phrase it as an inference.",
  "Hook angles must be specific enough to generate TikTok, Instagram Reels, and YouTube Shorts concepts.",
].join("\n");

export async function analyzeBrandProfile(
  scrape: BrandWebsiteScrape,
): Promise<BrandProfileAnalysis> {
  const output = await runClaudeAgentTask<unknown>({
    maxTurns: 1,
    outputSchema: BRAND_PROFILE_SCHEMA,
    prompt: buildBrandProfilePrompt(scrape),
    systemPrompt: SYSTEM_PROMPT,
    title: `Brand profile: ${new URL(scrape.rootUrl).hostname}`,
  });

  return normalizeBrandProfileAnalysis(output);
}

function buildBrandProfilePrompt(scrape: BrandWebsiteScrape) {
  return [
    `Website: ${scrape.rootUrl}`,
    "",
    "Create a structured brand profile with these exact fields:",
    "- productDescription: what the product/service does and why customers use it",
    "- audience: ICP and user/buyer audience",
    "- tone: concise voice guidance for UGC scripts",
    "- painPoints: customer pains, objections, anxieties, or desired outcomes",
    "- nicheTags: lowercase tags for trend matching",
    "- hookAngles: at least 20 distinct short-form video hook angles",
    "",
    "Scraped pages:",
    scrape.pages.map(formatPageForPrompt).join("\n\n"),
  ].join("\n");
}

function formatPageForPrompt(page: ScrapedBrandPage) {
  return [
    `## ${page.label}: ${page.url}`,
    page.title ? `Title: ${page.title}` : null,
    page.description ? `Description: ${page.description}` : null,
    page.text,
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeBrandProfileAnalysis(value: unknown): BrandProfileAnalysis {
  if (!isRecord(value)) {
    throw new Error("Claude returned an invalid brand profile payload.");
  }

  const analysis = {
    productDescription: getRequiredString(value, "productDescription"),
    audience: getRequiredString(value, "audience"),
    tone: getRequiredString(value, "tone"),
    painPoints: getStringArray(value.painPoints, 12),
    nicheTags: getStringArray(value.nicheTags, 14).map((tag) =>
      tag.toLowerCase(),
    ),
    hookAngles: getStringArray(value.hookAngles, 30),
  };

  if (analysis.painPoints.length < 4) {
    throw new Error("Claude returned fewer than four pain points.");
  }

  if (analysis.nicheTags.length < 4) {
    throw new Error("Claude returned fewer than four niche tags.");
  }

  if (analysis.hookAngles.length < 20) {
    throw new Error("Claude returned fewer than 20 hook angles.");
  }

  return analysis;
}

function getRequiredString(value: Record<string, unknown>, key: string) {
  const field = value[key];

  if (typeof field !== "string" || field.trim().length === 0) {
    throw new Error(`Claude returned an invalid ${key} field.`);
  }

  return field.trim();
}

function getStringArray(value: unknown, maxItems: number) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|,/)
      : [];
  const seen = new Set<string>();
  const items: string[] = [];

  for (const item of rawItems) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed = item
      .replace(/^[-*\d.]+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = trimmed.toLowerCase();

    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(trimmed);
  }

  return items.slice(0, maxItems);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
