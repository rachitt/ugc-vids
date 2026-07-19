import { runClaudeAgentTask } from "../ai/agent";
import {
  fnv1a,
  manifest,
  pickAsset,
  type BrollAsset,
  type GradientAsset,
  type ManifestAsset,
  type MusicAsset,
} from "../assets/manifest";
import { db } from "../db";
import { brandProfiles, contentItems } from "../db/schema";
import type { PromptRecipe } from "../trends/metadata";
import {
  type RemotionProps,
  type RemotionTheme,
  validateRemotionProps,
} from "../video/remotion-props";
import {
  contentFormatLabels,
  type RenderableContentFormat,
} from "./formats";

export type BrandProfileRow = typeof brandProfiles.$inferSelect;
export type ContentItemRow = typeof contentItems.$inferSelect;
export type ContentItemScript = NonNullable<
  (typeof contentItems.$inferInsert)["script"]
>;

export type GeneratedContentItem = Pick<
  ContentItemRow,
  | "brandProfileId"
  | "createdAt"
  | "format"
  | "id"
  | "renderStatus"
  | "remotionProps"
  | "script"
  | "status"
  | "updatedAt"
  | "videoUrl"
  | "workspaceId"
>;

export type ContentGenerationError = {
  format: RenderableContentFormat;
  message: string;
  scriptIndex: number;
};

export type GenerateContentItemsResult = {
  errors: ContentGenerationError[];
  items: GeneratedContentItem[];
  requestedCount: number;
};

type GenerateContentItemsInput = {
  brandProfile: BrandProfileRow;
  count: number;
  format: RenderableContentFormat;
  promptRecipe?: PromptRecipe;
  trendTemplateId?: string | null;
};

type ClaudeScript = {
  body?: unknown;
  caption?: unknown;
  cta?: unknown;
  demoSteps?: unknown;
  hashtags?: unknown;
  hook?: unknown;
  lines?: unknown;
  memeCaption?: unknown;
  reactionLabel?: unknown;
  slides?: unknown;
  subhook?: unknown;
};

type NormalizedScript = {
  caption: string;
  cta?: string;
  demoSteps: Array<{
    caption: string;
    label?: string;
  }>;
  hashtags: string[];
  hook: string;
  lines: string[];
  memeCaption?: string;
  reactionLabel?: string;
  slides: string[];
  subhook?: string;
};

const SYSTEM_PROMPT = [
  "You are a senior UGC strategist for short-form TikTok, Instagram Reels, and YouTube Shorts ads.",
  "Create concrete scripts that can be rendered by a programmatic video engine without extra human editing.",
  "Use the supplied brand profile only. Do not invent unsupported product features, pricing, customers, claims, or metrics.",
  "Every item should use a distinct hook angle, pain point, or niche tag from the profile.",
].join("\n");

const FORMAT_RECIPES: Record<RenderableContentFormat, string[]> = {
  greenscreen_meme: [
    "Use a POV or reaction-meme setup.",
    "The hook should be short enough to sit as top meme text.",
    "memeCaption should be the punchline shown in the bottom caption bar.",
    "reactionLabel should name the emotional reaction or before/after moment.",
  ],
  hook_demo: [
    "Open with a direct hook that names a painful status quo.",
    "Use demoSteps as product-shot captions for a 2-4 step walkthrough.",
    "Keep every step visual and concrete, not strategic advice.",
    "cta should be a short action-oriented closing line.",
  ],
  slideshow: [
    "Use a list, myth, mistake, comparison, or reasons structure.",
    "slides should be 3-5 short card captions that advance the hook.",
    "Each slide should be understandable without voiceover.",
    "Avoid repeating the same sentence shape across slides.",
  ],
  wall_of_text: [
    "Use a dense, save-worthy note style.",
    "body should be 3-5 newline-separated lines with one useful idea per line.",
    "Lead with a contrarian or diagnostic headline.",
    "Make it feel like a founder, operator, or expert wrote it.",
  ],
};

const MUSIC_MOOD_BY_FORMAT: Record<RenderableContentFormat, MusicAsset["mood"]> = {
  greenscreen_meme: "upbeat",
  hook_demo: "epic",
  slideshow: "upbeat",
  wall_of_text: "chill",
};

const IMAGE_BROLL_ASSETS = manifest.broll.filter(
  (asset): asset is BrollAsset & { kind: "image" } => asset.kind === "image",
);

export async function generateContentItems({
  brandProfile,
  count,
  format,
  promptRecipe,
  trendTemplateId,
}: GenerateContentItemsInput): Promise<GenerateContentItemsResult> {
  const requestedCount = clampScriptCount(count);
  const output = await runClaudeAgentTask<unknown>({
    maxTurns: 1,
    outputSchema: buildContentScriptsSchema(format, requestedCount),
    prompt: buildContentGenerationPrompt(
      brandProfile,
      format,
      requestedCount,
      promptRecipe,
    ),
    systemPrompt: SYSTEM_PROMPT,
    title: `Content generation: ${contentFormatLabels[format]}`,
  });
  const rawScripts = getClaudeScripts(output, requestedCount);
  const items: GeneratedContentItem[] = [];
  const errors: ContentGenerationError[] = [];

  for (let index = 0; index < rawScripts.length; index += 1) {
    try {
      const script = normalizeClaudeScript(rawScripts[index], format);
      const remotionProps = mapScriptToRemotionProps(
        brandProfile,
        format,
        script,
        index,
      );
      const scriptJson = mapScriptToContentItemScript(format, script);
      const [item] = await db
        .insert(contentItems)
        .values({
          brandProfileId: brandProfile.id,
          format,
          renderStatus: "idle",
          remotionProps: remotionProps as unknown as Record<string, unknown>,
          script: scriptJson,
          status: "generated",
          trendTemplateId: trendTemplateId ?? null,
          workspaceId: brandProfile.workspaceId,
        })
        .returning({
          brandProfileId: contentItems.brandProfileId,
          createdAt: contentItems.createdAt,
          format: contentItems.format,
          id: contentItems.id,
          renderStatus: contentItems.renderStatus,
          remotionProps: contentItems.remotionProps,
          script: contentItems.script,
          status: contentItems.status,
          updatedAt: contentItems.updatedAt,
          videoUrl: contentItems.videoUrl,
          workspaceId: contentItems.workspaceId,
        });

      if (!item) {
        throw new Error("The generated content item could not be saved.");
      }

      items.push(item);
    } catch (error) {
      errors.push({
        format,
        message: toErrorMessage(error),
        scriptIndex: index,
      });
    }
  }

  if (rawScripts.length < requestedCount) {
    errors.push({
      format,
      message: `Claude returned ${rawScripts.length} script(s), expected ${requestedCount}.`,
      scriptIndex: rawScripts.length,
    });
  }

  return {
    errors,
    items,
    requestedCount,
  };
}

function buildContentGenerationPrompt(
  brandProfile: BrandProfileRow,
  format: RenderableContentFormat,
  count: number,
  promptRecipe?: PromptRecipe,
) {
  const brand = buildRemotionBrand(brandProfile);

  return [
    `Generate exactly ${count} ${contentFormatLabels[format]} script(s).`,
    "",
    "Brand profile:",
    `- Brand name: ${brand.name}`,
    `- Website: ${brandProfile.url}`,
    `- Product: ${brandProfile.productDesc ?? "Unknown product"}`,
    `- Audience: ${brandProfile.audience ?? "Unknown audience"}`,
    `- Tone: ${brandProfile.tone ?? "Clear, specific, UGC-native"}`,
    `- Niche tags: ${formatList(brandProfile.nicheTags)}`,
    `- Pain points: ${formatList(brandProfile.painPoints)}`,
    `- Hook angles: ${formatList(brandProfile.hookAngles)}`,
    "",
    "Prompt recipe:",
    FORMAT_RECIPES[format].map((line) => `- ${line}`).join("\n"),
    promptRecipe ? formatTrendPromptRecipe(promptRecipe) : null,
    "",
    "Required output:",
    "- hook: primary on-screen hook",
    "- caption: post caption without hashtags",
    "- hashtags: 4-8 relevant hashtags",
    format === "slideshow"
      ? "- slides: 3-5 short slide captions"
      : null,
    format === "wall_of_text"
      ? "- body: 3-5 newline-separated lines for the dense text block"
      : null,
    format === "greenscreen_meme"
      ? "- memeCaption and reactionLabel for the meme overlay"
      : null,
    format === "hook_demo"
      ? "- subhook, demoSteps, and cta for the product walkthrough"
      : null,
    "",
    promptRecipe
      ? "Use the trend prompt recipe as the structure, then adapt it with the profile's brand name, tone, hook_angles, pain_points, and niche_tags. Make each script distinct."
      : "Use the profile's hook_angles, pain_points, tone, and niche_tags as source material. Make each script distinct.",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatTrendPromptRecipe(promptRecipe: PromptRecipe) {
  return [
    "",
    "Trend prompt recipe:",
    `- Hook: ${promptRecipe.hook}`,
    `- Setup: ${promptRecipe.setup}`,
    promptRecipe.beats.length
      ? `- Beats:\n${formatList(promptRecipe.beats)}`
      : null,
    promptRecipe.visualPlan.length
      ? `- Visual plan:\n${formatList(promptRecipe.visualPlan)}`
      : null,
    promptRecipe.proofCue ? `- Proof cue: ${promptRecipe.proofCue}` : null,
    `- CTA: ${promptRecipe.cta}`,
    `- Generation notes: ${promptRecipe.generationNotes}`,
    promptRecipe.avoid.length
      ? `- Avoid:\n${formatList(promptRecipe.avoid)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildContentScriptsSchema(
  format: RenderableContentFormat,
  count: number,
) {
  const commonProperties = {
    caption: {
      description: "A social caption without hashtags.",
      minLength: 18,
      type: "string",
    },
    hashtags: {
      items: {
        minLength: 2,
        type: "string",
      },
      maxItems: 8,
      minItems: 4,
      type: "array",
    },
    hook: {
      description: "The primary on-screen hook.",
      minLength: 8,
      type: "string",
    },
  } satisfies Record<string, unknown>;

  const byFormat: Record<RenderableContentFormat, Record<string, unknown>> = {
    greenscreen_meme: {
      additionalProperties: false,
      properties: {
        ...commonProperties,
        memeCaption: {
          minLength: 8,
          type: "string",
        },
        reactionLabel: {
          minLength: 4,
          type: "string",
        },
      },
      required: [
        "hook",
        "memeCaption",
        "reactionLabel",
        "caption",
        "hashtags",
      ],
      type: "object",
    },
    hook_demo: {
      additionalProperties: false,
      properties: {
        ...commonProperties,
        cta: {
          minLength: 8,
          type: "string",
        },
        demoSteps: {
          items: {
            additionalProperties: false,
            properties: {
              caption: {
                minLength: 8,
                type: "string",
              },
              label: {
                minLength: 3,
                type: "string",
              },
            },
            required: ["label", "caption"],
            type: "object",
          },
          maxItems: 4,
          minItems: 2,
          type: "array",
        },
        subhook: {
          minLength: 12,
          type: "string",
        },
      },
      required: [
        "hook",
        "subhook",
        "demoSteps",
        "cta",
        "caption",
        "hashtags",
      ],
      type: "object",
    },
    slideshow: {
      additionalProperties: false,
      properties: {
        ...commonProperties,
        slides: {
          items: {
            minLength: 8,
            type: "string",
          },
          maxItems: 5,
          minItems: 3,
          type: "array",
        },
      },
      required: ["hook", "slides", "caption", "hashtags"],
      type: "object",
    },
    wall_of_text: {
      additionalProperties: false,
      properties: {
        ...commonProperties,
        body: {
          description: "Three to five newline-separated lines.",
          minLength: 40,
          type: "string",
        },
      },
      required: ["hook", "body", "caption", "hashtags"],
      type: "object",
    },
  };

  return {
    additionalProperties: false,
    properties: {
      scripts: {
        items: byFormat[format],
        maxItems: count,
        minItems: count,
        type: "array",
      },
    },
    required: ["scripts"],
    type: "object",
  } satisfies Record<string, unknown>;
}

function getClaudeScripts(output: unknown, count: number): ClaudeScript[] {
  if (!isRecord(output) || !Array.isArray(output.scripts)) {
    throw new Error("Claude returned an invalid content script payload.");
  }

  return output.scripts.slice(0, count).map((script) => {
    if (!isRecord(script)) {
      throw new Error("Claude returned a non-object content script.");
    }

    return script;
  });
}

function normalizeClaudeScript(
  rawScript: ClaudeScript,
  format: RenderableContentFormat,
): NormalizedScript {
  const hook = getRequiredString(rawScript, "hook");
  const caption = getRequiredString(rawScript, "caption");
  const hashtags = getStringArray(rawScript.hashtags, 8);
  const body = getOptionalString(rawScript.body);
  const rawSlides = getStringArray(rawScript.slides, 6);
  const rawLines = getStringArray(rawScript.lines, 6);
  const bodyLines = body ? splitBodyLines(body) : rawLines;
  const slides = rawSlides.length > 0 ? rawSlides : bodyLines;
  const lines = bodyLines.length > 0 ? bodyLines : rawSlides;
  const normalized: NormalizedScript = {
    caption,
    demoSteps: normalizeDemoSteps(rawScript.demoSteps),
    hashtags,
    hook,
    lines,
    memeCaption: getOptionalString(rawScript.memeCaption),
    reactionLabel: getOptionalString(rawScript.reactionLabel),
    slides,
    subhook: getOptionalString(rawScript.subhook),
    cta: getOptionalString(rawScript.cta),
  };

  switch (format) {
    case "greenscreen_meme":
      normalized.memeCaption =
        normalized.memeCaption ?? normalized.lines[0] ?? normalized.hook;
      normalized.reactionLabel =
        normalized.reactionLabel ?? normalized.lines[1] ?? "Relatable";
      break;
    case "hook_demo":
      if (normalized.demoSteps.length === 0) {
        normalized.demoSteps = fallbackDemoSteps(normalized);
      }
      break;
    case "slideshow":
      if (normalized.slides.length < 2) {
        throw new Error("Slideshow scripts need at least two slides.");
      }
      break;
    case "wall_of_text":
      if (normalized.lines.length === 0) {
        throw new Error("Wall-of-text scripts need body lines.");
      }
      break;
  }

  return normalized;
}

function mapScriptToRemotionProps(
  brandProfile: BrandProfileRow,
  format: RenderableContentFormat,
  script: NormalizedScript,
  itemIndex: number,
): RemotionProps {
  const brand = buildRemotionBrand(brandProfile);
  const theme = buildRemotionTheme(brandProfile.colors);
  const common = {
    brand,
    caption: trimText(script.caption, 130),
    durationInFrames: format === "greenscreen_meme" ? 300 : 360,
    format,
    hashtags: normalizeHashtags(script.hashtags, brandProfile.nicheTags),
    music: {
      src: musicAssetUri(brandProfile, format, itemIndex),
      volume: 0.06,
    },
    theme,
    title: trimText(script.hook, format === "greenscreen_meme" ? 70 : 82),
  };

  switch (format) {
    case "greenscreen_meme":
      return validateRemotionProps({
        ...common,
        greenscreenMeme: {
          background: {
            label: "Meme setup",
            src: assetUri(
              pickAsset(
                manifest.memeBackgrounds,
                assetSeed(brandProfile.id, format, itemIndex, 1),
              ),
              "placeholder:meme",
            ),
          },
          caption: trimText(script.memeCaption ?? script.hook, 72),
          captionBar: theme.background,
          persona: {
            label: brand.name,
            src: assetUri(
              pickAsset(
                manifest.personas,
                assetSeed(brandProfile.id, format, itemIndex, 2),
              ),
              "placeholder:persona",
            ),
          },
          reactionLabel: trimText(script.reactionLabel ?? "Relatable", 42),
        },
      });
    case "hook_demo":
      return validateRemotionProps({
        ...common,
        durationInFrames: 390,
        hookDemo: {
          cta: trimText(script.cta ?? "Try this angle in your next short", 68),
          hook: trimText(script.hook, 82),
          shots: script.demoSteps.slice(0, 4).map((step, index) => ({
            caption: trimText(step.caption, 74),
            image: {
              label: step.label ?? `Step ${index + 1}`,
              src: assetUri(
                pickVisualAsset(brandProfile.id, format, itemIndex, index + 1),
                "placeholder:product",
              ),
            },
            label: trimText(step.label ?? `Step ${index + 1}`, 28),
          })),
          subhook: trimText(
            script.subhook ?? "Here is the product moment to show.",
            90,
          ),
        },
      });
    case "slideshow":
      return validateRemotionProps({
        ...common,
        slideshow: {
          kicker: firstNicheTag(brandProfile) ?? "UGC angle",
          slides: script.slides.slice(0, 6).map((slide, index) => ({
            caption: trimText(slide, 78),
            eyebrow: `Slide ${index + 1}`,
            image: {
              label: `Scene ${index + 1}`,
              src: assetUri(
                pickVisualAsset(brandProfile.id, format, itemIndex, index + 1),
                "placeholder:dashboard",
              ),
            },
          })),
        },
      });
    case "wall_of_text":
      return validateRemotionProps({
        ...common,
        theme: {
          ...theme,
          accent: theme.secondary,
        },
        wallOfText: {
          body: script.lines.slice(0, 5).map((line) => trimText(line, 92)).join("\n"),
          broll: [
            {
              label: firstNicheTag(brandProfile) ?? "Customer proof",
              src: assetUri(
                pickWallOfTextBackground(brandProfile.id, format, itemIndex),
                "placeholder:social",
              ),
            },
          ],
          headline: trimText(script.hook, 82),
          sourceLabel: firstNicheTag(brandProfile) ?? brand.name,
        },
      });
  }
}

function mapScriptToContentItemScript(
  format: RenderableContentFormat,
  script: NormalizedScript,
): ContentItemScript {
  const base = {
    caption: script.caption,
    hashtags: normalizeHashtags(script.hashtags, []),
    hook: script.hook,
  };

  if (format === "slideshow") {
    return {
      ...base,
      slides: script.slides.slice(0, 6),
    };
  }

  if (format === "hook_demo") {
    return {
      ...base,
      lines: script.demoSteps.map((step) => step.caption).slice(0, 6),
    };
  }

  if (format === "greenscreen_meme") {
    return {
      ...base,
      lines: [script.memeCaption ?? script.hook, script.reactionLabel ?? ""].filter(
        Boolean,
      ),
    };
  }

  return {
    ...base,
    lines: script.lines.slice(0, 6),
  };
}

function buildRemotionBrand(brandProfile: BrandProfileRow) {
  const hostname = hostnameFromUrl(brandProfile.url);
  const brandName = titleCase(hostname.split(".")[0] || "Brand");
  const handle = hostname
    .split(".")[0]
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();

  return {
    handle: handle ? `@${handle}` : undefined,
    logoSrc: brandProfile.logoUrl ?? undefined,
    name: brandName,
  };
}

function buildRemotionTheme(colors: Record<string, string>): RemotionTheme {
  const palette = Object.values(colors).filter(isHexColor);
  const accent = palette[0] ?? "#22c55e";
  const secondary = palette.find((color) => color !== accent) ?? "#38bdf8";

  return {
    accent,
    background: "#0f172a",
    foreground: "#f8fafc",
    muted: "#94a3b8",
    secondary,
  };
}

function normalizeDemoSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const steps: NormalizedScript["demoSteps"] = [];

  for (const step of value) {
    if (!isRecord(step)) {
      continue;
    }

    const caption = getOptionalString(step.caption);

    if (!caption) {
      continue;
    }

    steps.push({
      caption,
      label: getOptionalString(step.label),
    });
  }

  return steps.slice(0, 6);
}

function fallbackDemoSteps(script: NormalizedScript) {
  const source = script.lines.length > 0 ? script.lines : script.slides;
  const lines = source.length > 0 ? source : [script.caption];

  return lines.slice(0, 3).map((line, index) => ({
    caption: line,
    label: `Step ${index + 1}`,
  }));
}

function normalizeHashtags(hashtags: string[], fallbackTags: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawTag of [...hashtags, ...fallbackTags]) {
    const tag = rawTag
      .replace(/^#/, "")
      .replace(/[^a-z0-9_]/gi, "")
      .toLowerCase();

    if (!tag || seen.has(tag)) {
      continue;
    }

    seen.add(tag);
    normalized.push(`#${tag}`);
  }

  return normalized.slice(0, 8);
}

function splitBodyLines(body: string) {
  const newlineLines = body
    .split(/\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);

  if (newlineLines.length > 1) {
    return newlineLines.slice(0, 6);
  }

  return body
    .split(/(?<=[.!?])\s+/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .slice(0, 6);
}

function getRequiredString(value: Record<string, unknown>, key: string) {
  const field = value[key];

  if (typeof field !== "string" || field.trim().length === 0) {
    throw new Error(`Claude returned an invalid ${key} field.`);
  }

  return cleanText(field);
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = cleanText(value);

  return trimmed.length > 0 ? trimmed : undefined;
}

function getStringArray(value: unknown, maxItems: number) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|,/)
      : [];
  const items: string[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed = cleanText(item);
    const key = trimmed.toLowerCase();

    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(trimmed);
  }

  return items.slice(0, maxItems);
}

function assetSeed(
  brandProfileId: BrandProfileRow["id"],
  format: RenderableContentFormat,
  itemIndex: number,
  slotIndex: number,
) {
  return `${brandProfileId}:${format}:${itemIndex}:${slotIndex}`;
}

function assetUri(asset: ManifestAsset | undefined, fallbackSrc: string) {
  return asset ? `asset:${asset.id}` : fallbackSrc;
}

function musicAssetUri(
  brandProfile: BrandProfileRow,
  format: RenderableContentFormat,
  itemIndex: number,
) {
  const mood = MUSIC_MOOD_BY_FORMAT[format];
  const pool = manifest.music.filter((asset) => asset.mood === mood);

  return assetUri(
    pickAsset(pool, assetSeed(brandProfile.id, format, itemIndex, 0)),
    "silent:placeholder",
  );
}

function pickVisualAsset(
  brandProfileId: BrandProfileRow["id"],
  format: RenderableContentFormat,
  itemIndex: number,
  slotIndex: number,
) {
  const selected = pickAsset(
    IMAGE_BROLL_ASSETS,
    assetSeed(brandProfileId, format, itemIndex, slotIndex),
  );

  if (!selected || IMAGE_BROLL_ASSETS.length < 2 || slotIndex <= 1) {
    return selected;
  }

  const previous = pickVisualAsset(
    brandProfileId,
    format,
    itemIndex,
    slotIndex - 1,
  );

  if (!previous || previous.id !== selected.id) {
    return selected;
  }

  const selectedIndex = IMAGE_BROLL_ASSETS.findIndex(
    (asset) => asset.id === selected.id,
  );

  return IMAGE_BROLL_ASSETS[(selectedIndex + 1) % IMAGE_BROLL_ASSETS.length];
}

function pickWallOfTextBackground(
  brandProfileId: BrandProfileRow["id"],
  format: RenderableContentFormat,
  itemIndex: number,
): BrollAsset | GradientAsset | undefined {
  const seed = assetSeed(brandProfileId, format, itemIndex, 1);
  const pool: readonly (BrollAsset | GradientAsset)[] =
    fnv1a(seed) % 2 === 0 ? manifest.gradients : IMAGE_BROLL_ASSETS;

  return pickAsset(pool, seed);
}

function firstNicheTag(brandProfile: BrandProfileRow) {
  return brandProfile.nicheTags[0]?.replace(/^#/, "");
}

function formatList(items: string[]) {
  if (items.length === 0) {
    return "none supplied";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function trimText(input: string, maxLength: number) {
  const text = cleanText(input);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function cleanText(input: string) {
  return input.replace(/^[-*\d.]+\s*/, "").replace(/\s+/g, " ").trim();
}

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

function titleCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function clampScriptCount(count: number) {
  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(12, Math.max(1, Math.floor(count)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Content generation failed.";
}
