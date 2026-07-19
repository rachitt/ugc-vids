export type PromptRecipe = {
  hook: string;
  setup: string;
  beats: string[];
  visualPlan: string[];
  proofCue?: string;
  cta: string;
  generationNotes: string;
  avoid: string[];
};

export type TrendTemplateMetadata = {
  kind: "fastlane.trend-template.metadata";
  sourcePattern: string;
  promptRecipe: PromptRecipe;
  seedVersion?: string;
  updatedBy?: string;
};

const metadataKind = "fastlane.trend-template.metadata";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function parsePromptRecipe(value: unknown): PromptRecipe | null {
  if (!isRecord(value)) {
    return null;
  }

  const hook = value.hook;
  const setup = value.setup;
  const cta = value.cta;
  const generationNotes = value.generationNotes;

  if (
    typeof hook !== "string" ||
    typeof setup !== "string" ||
    typeof cta !== "string" ||
    typeof generationNotes !== "string"
  ) {
    return null;
  }

  return {
    avoid: stringArray(value.avoid),
    beats: stringArray(value.beats),
    cta,
    generationNotes,
    hook,
    proofCue: typeof value.proofCue === "string" ? value.proofCue : undefined,
    setup,
    visualPlan: stringArray(value.visualPlan),
  };
}

export function stringifyTrendTemplateMetadata(
  metadata: Omit<TrendTemplateMetadata, "kind">,
): string {
  return JSON.stringify(
    {
      kind: metadataKind,
      ...metadata,
    } satisfies TrendTemplateMetadata,
    null,
    2,
  );
}

export function parseTrendTemplateMetadata(
  exampleRef: string | null,
): TrendTemplateMetadata | null {
  if (!exampleRef) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(exampleRef);

    if (!isRecord(parsed)) {
      return null;
    }

    const promptRecipe = parsePromptRecipe(parsed.promptRecipe);

    if (!promptRecipe) {
      return null;
    }

    return {
      kind: metadataKind,
      promptRecipe,
      seedVersion:
        typeof parsed.seedVersion === "string" ? parsed.seedVersion : undefined,
      sourcePattern:
        typeof parsed.sourcePattern === "string"
          ? parsed.sourcePattern
          : "manual",
      updatedBy:
        typeof parsed.updatedBy === "string" ? parsed.updatedBy : undefined,
    };
  } catch {
    return null;
  }
}

export function createFallbackPromptRecipe(
  title: string,
  structureDescription: string,
): PromptRecipe {
  return {
    avoid: ["generic hype", "long intro", "unsubstantiated results"],
    beats: [
      "Open with the exact viewer problem.",
      "Show the product or behavior shift that resolves it.",
      "Close with a specific next action.",
    ],
    cta: "Ask viewers to save or remix the idea for their own workflow.",
    generationNotes:
      "Keep every on-screen line under nine words and make the first frame readable without audio.",
    hook: title,
    setup: structureDescription,
    visualPlan: [
      "Start with a high-contrast text hook.",
      "Cut into the default fixture shots for the selected format.",
      "End on a clean branded proof or CTA frame.",
    ],
  };
}
