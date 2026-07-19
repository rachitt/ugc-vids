import { z } from "zod";
import {
  renderableContentFormats,
  type RenderableContentFormat,
} from "../content/formats";

export const REMOTION_VIDEO_WIDTH = 1080;
export const REMOTION_VIDEO_HEIGHT = 1920;
export const REMOTION_FPS = 30;
export const DEFAULT_REMOTION_DURATION_IN_FRAMES = 360;

export const compositionIds = [
  "slideshow",
  "wall-of-text",
  "greenscreen-meme",
  "hook-demo",
] as const;

export type RemotionCompositionId = (typeof compositionIds)[number];

const AssetSchema = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
  label: z.string().optional(),
});

const MusicSchema = z.object({
  src: z.string().min(1),
  volume: z.number().min(0).max(1).default(0.08),
});

const ThemeSchema = z.object({
  background: z.string().min(1).default("#0f172a"),
  foreground: z.string().min(1).default("#f8fafc"),
  accent: z.string().min(1).default("#22c55e"),
  secondary: z.string().min(1).default("#38bdf8"),
  muted: z.string().min(1).default("#94a3b8"),
});

const BrandSchema = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  logoSrc: z.string().optional(),
});

const SlideshowSchema = z.object({
  kicker: z.string().optional(),
  slides: z
    .array(
      z.object({
        image: AssetSchema,
        caption: z.string().min(1),
        eyebrow: z.string().optional(),
      }),
    )
    .min(2)
    .max(8),
});

const WallOfTextSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  sourceLabel: z.string().optional(),
  timestampLabel: z.string().optional(),
  footerCue: z.string().optional(),
  broll: z.array(AssetSchema).min(1).max(4).default([]),
});

const GreenscreenMemeSchema = z.object({
  background: AssetSchema,
  persona: AssetSchema,
  caption: z.string().min(1),
  captionBar: z.string().optional(),
  reactionLabel: z.string().optional(),
});

const HookDemoSchema = z.object({
  hook: z.string().min(1),
  subhook: z.string().optional(),
  shots: z
    .array(
      z.object({
        image: AssetSchema,
        label: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .min(1)
    .max(6),
  cta: z.string().optional(),
});

export const RemotionPropsSchema = z
  .object({
    format: z.enum(renderableContentFormats),
    durationInFrames: z
      .number()
      .int()
      .min(60)
      .max(1800)
      .default(DEFAULT_REMOTION_DURATION_IN_FRAMES),
    title: z.string().min(1),
    caption: z.string().optional(),
    hashtags: z.array(z.string().min(1)).max(12).default([]),
    brand: BrandSchema,
    theme: ThemeSchema.default({
      accent: "#22c55e",
      background: "#0f172a",
      foreground: "#f8fafc",
      muted: "#94a3b8",
      secondary: "#38bdf8",
    }),
    music: MusicSchema.optional(),
    slideshow: SlideshowSchema.optional(),
    wallOfText: WallOfTextSchema.optional(),
    greenscreenMeme: GreenscreenMemeSchema.optional(),
    hookDemo: HookDemoSchema.optional(),
  })
  .superRefine((props, context) => {
    const requiredByFormat: Record<RenderableContentFormat, keyof typeof props> = {
      greenscreen_meme: "greenscreenMeme",
      hook_demo: "hookDemo",
      slideshow: "slideshow",
      wall_of_text: "wallOfText",
    };
    const requiredKey = requiredByFormat[props.format];

    if (!props[requiredKey]) {
      context.addIssue({
        code: "custom",
        message: `Expected ${String(requiredKey)} props for ${props.format}.`,
        path: [requiredKey],
      });
    }
  });

export type RemotionProps = z.infer<typeof RemotionPropsSchema>;
export type MediaAsset = z.infer<typeof AssetSchema>;
export type RemotionTheme = z.infer<typeof ThemeSchema>;

export function validateRemotionProps(input: unknown): RemotionProps {
  return RemotionPropsSchema.parse(input);
}

export function getRemotionDurationInFrames(input: RemotionProps): number {
  return input.durationInFrames ?? DEFAULT_REMOTION_DURATION_IN_FRAMES;
}

export function compositionIdForFormat(
  format: RenderableContentFormat,
): RemotionCompositionId {
  switch (format) {
    case "slideshow":
      return "slideshow";
    case "wall_of_text":
      return "wall-of-text";
    case "greenscreen_meme":
      return "greenscreen-meme";
    case "hook_demo":
      return "hook-demo";
  }
}

export function formatForCompositionId(
  compositionId: string,
): RenderableContentFormat | null {
  switch (compositionId) {
    case "slideshow":
      return "slideshow";
    case "wall-of-text":
    case "wall_of_text":
      return "wall_of_text";
    case "greenscreen-meme":
    case "greenscreen_meme":
      return "greenscreen_meme";
    case "hook-demo":
    case "hook_demo":
      return "hook_demo";
    default:
      return null;
  }
}

export function normalizeCompositionId(
  compositionId: string | undefined,
  format: RenderableContentFormat,
): RemotionCompositionId {
  if (!compositionId) {
    return compositionIdForFormat(format);
  }

  const normalizedFormat = formatForCompositionId(compositionId);
  if (!normalizedFormat) {
    throw new Error(`Unknown Remotion composition id "${compositionId}".`);
  }

  return compositionIdForFormat(normalizedFormat);
}
