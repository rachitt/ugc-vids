import { createPortraitPlaceholderDataUri } from "./placeholders";
import type { AvatarPersonaMetadata } from "./types";

export const FAL_AI_CHARACTER_IMAGE_FEATURE_FLAG =
  "FASTLANE_ENABLE_FAL_CHARACTER_IMAGES";

export type CharacterImageGenerationInput = {
  workspaceId: string;
  name: string;
  lookPrompt: string;
  vibeTone: string;
};

export type CharacterImageGenerationResult = {
  imageUrls: string[];
  provider: string;
  model: string;
  featureFlagEnabled: boolean;
};

export interface CharacterImageGenerator {
  generateCharacterSheet(
    input: CharacterImageGenerationInput,
  ): Promise<CharacterImageGenerationResult>;
}

export class StubCharacterImageGenerator implements CharacterImageGenerator {
  constructor(
    private readonly options: {
      provider: string;
      featureFlagEnabled: boolean;
    },
  ) {}

  async generateCharacterSheet(input: CharacterImageGenerationInput) {
    return {
      imageUrls: [
        createPortraitPlaceholderDataUri({
          name: input.name,
          label: "Custom avatar",
          seed: `${input.workspaceId}:${input.name}:${input.lookPrompt}`,
        }),
      ],
      provider: this.options.provider,
      model: "stub-character-sheet-v1",
      featureFlagEnabled: this.options.featureFlagEnabled,
    };
  }
}

function toneTagsFromVibe(vibeTone: string) {
  return vibeTone
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function getCharacterImageGenerator(): CharacterImageGenerator {
  const featureFlagEnabled =
    process.env[FAL_AI_CHARACTER_IMAGE_FEATURE_FLAG] === "true";

  return new StubCharacterImageGenerator({
    provider: featureFlagEnabled ? "fal.ai-ready-stub" : "stub",
    featureFlagEnabled,
  });
}

export function buildCharacterSheetPersonaMetadata(
  input: CharacterImageGenerationInput,
  result: CharacterImageGenerationResult,
): AvatarPersonaMetadata {
  return {
    persona: "custom_ai_influencer",
    style: "custom",
    vibe: input.vibeTone,
    toneTags: toneTagsFromVibe(input.vibeTone),
    nicheTags: [],
    traits: ["consistent-character", "prompt-built"],
    characterSheet: {
      lookPrompt: input.lookPrompt,
      vibeTone: input.vibeTone,
      faceAnchor: `Keep ${input.name}'s face, hair, and proportions consistent across scenes.`,
      wardrobe: "Use wardrobe details from the look prompt unless a campaign overrides them.",
      shotGuidance:
        "Generate portrait, waist-up, expression, and product-hold references before motion work.",
    },
    generation: {
      provider: result.provider,
      model: result.model,
      featureFlagEnabled: result.featureFlagEnabled,
      generatedAt: new Date().toISOString(),
    },
  };
}
