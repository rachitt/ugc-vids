import type { contentItems } from "../db/schema";

export const DEFAULT_MIXED_BATCH_SIZE = 12;

export type ContentFormat = typeof contentItems.$inferSelect.format;

export const renderableContentFormats = [
  "slideshow",
  "wall_of_text",
  "greenscreen_meme",
  "hook_demo",
] as const satisfies readonly ContentFormat[];

export type RenderableContentFormat =
  (typeof renderableContentFormats)[number];

export const contentFormats = [
  ...renderableContentFormats,
  "avatar_ugc",
] as const satisfies readonly ContentFormat[];

export const contentFormatLabels: Record<ContentFormat, string> = {
  avatar_ugc: "Avatar UGC",
  greenscreen_meme: "Greenscreen meme",
  hook_demo: "Hook demo",
  slideshow: "Slideshow",
  wall_of_text: "Wall of text",
};

export function getContentFormatLabel(format: ContentFormat) {
  return contentFormatLabels[format];
}

export function getContentInitials(format: ContentFormat) {
  return getContentFormatLabel(format)
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isContentFormat(value: unknown): value is ContentFormat {
  return (
    typeof value === "string" &&
    contentFormats.some((format) => format === value)
  );
}

export function isRenderableContentFormat(
  value: unknown,
): value is RenderableContentFormat {
  return (
    typeof value === "string" &&
    renderableContentFormats.some((format) => format === value)
  );
}

export function buildMixedFormatPlan(totalCount = DEFAULT_MIXED_BATCH_SIZE) {
  const count = clampBatchSize(totalCount);
  const plan: RenderableContentFormat[] = [];

  for (let index = 0; index < count; index += 1) {
    plan.push(
      renderableContentFormats[index % renderableContentFormats.length],
    );
  }

  return plan;
}

export function clampBatchSize(totalCount: number) {
  if (!Number.isFinite(totalCount)) {
    return DEFAULT_MIXED_BATCH_SIZE;
  }

  return Math.min(50, Math.max(1, Math.floor(totalCount)));
}
