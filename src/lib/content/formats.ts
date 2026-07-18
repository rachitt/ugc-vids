import {
  contentFormats,
  type ContentFormat,
} from "../video/remotion-props";

export const DEFAULT_MIXED_BATCH_SIZE = 12;

export const contentFormatLabels: Record<ContentFormat, string> = {
  greenscreen_meme: "Greenscreen meme",
  hook_demo: "Hook demo",
  slideshow: "Slideshow",
  wall_of_text: "Wall of text",
};

export function isContentFormat(value: unknown): value is ContentFormat {
  return (
    typeof value === "string" &&
    contentFormats.some((format) => format === value)
  );
}

export function buildMixedFormatPlan(totalCount = DEFAULT_MIXED_BATCH_SIZE) {
  const count = clampBatchSize(totalCount);
  const plan: ContentFormat[] = [];

  for (let index = 0; index < count; index += 1) {
    plan.push(contentFormats[index % contentFormats.length]);
  }

  return plan;
}

export function clampBatchSize(totalCount: number) {
  if (!Number.isFinite(totalCount)) {
    return DEFAULT_MIXED_BATCH_SIZE;
  }

  return Math.min(50, Math.max(1, Math.floor(totalCount)));
}
