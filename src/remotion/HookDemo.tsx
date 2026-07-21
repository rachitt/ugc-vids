import type { CSSProperties } from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";

import type { RemotionProps, RemotionTheme } from "../lib/video/remotion-props";
import {
  beatFrames,
  beatIndexAtFrame,
  getMusicBeatMetadata,
  snapToBeat,
} from "./beats";
import { WordCaptions } from "./captions";
import { ARCHIVO_BLACK_FONT_FAMILY } from "./fonts";
import { BOTTOM_SAFE, RIGHT_SAFE, SafeArea, TOP_SAFE } from "./layout";
import { resolveAudioSrc, resolveMediaSrc, themeOrDefault } from "./media";
import {
  GrainOverlay,
  PhoneFrame,
  remotionFontFamily,
  StickerChip,
} from "./primitives";
import { parseCompositionProps } from "./props";

const TARGET_HOOK_FRAMES = 75;
const FALLBACK_BPM = 120;
const MAX_DEMO_SHOTS = 4;
const MIN_CTA_FRAMES = 45;
const MAX_CTA_FRAMES = 60;
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)(?:[?#].*)?$/i;
const HOOK_CAPTION_START_FRAME = 4;
const HOOK_CAPTION_MAX_CONTENT_WIDTH = 900;
const HOOK_SUBHOOK_BOTTOM = BOTTOM_SAFE + 156;

type HookDemoData = NonNullable<RemotionProps["hookDemo"]>;
type HookDemoShot = HookDemoData["shots"][number];
type HookDemoCapture = NonNullable<HookDemoData["captures"]>[number];

type RgbColor = {
  b: number;
  g: number;
  r: number;
};

type BeatTiming = {
  bpm: number;
  downbeatOffsetSec: number;
  framesPerBeat: number;
};

type HookCaptionTheme = {
  color: string;
  highlightColor: string;
  scrimStyle: CSSProperties;
  textShadow: CSSProperties["textShadow"];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseHexColor(color: string): RgbColor | null {
  const match = color.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/iu);

  if (!match) {
    return null;
  }

  const hex =
    match[1].length === 3
      ? Array.from(match[1])
          .map((character) => `${character}${character}`)
          .join("")
      : match[1];
  const value = Number.parseInt(hex, 16);

  return {
    b: value & 255,
    g: (value >> 8) & 255,
    r: (value >> 16) & 255,
  };
}

function rgbaFromThemeColor(
  color: string,
  alpha: number,
  fallback: string,
): string {
  const rgb = parseHexColor(color);

  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : fallback;
}

function relativeLuminance(color: string): number | null {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return null;
  }

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

function averageContrastAgainstPalette(
  textColor: string,
  palette: string[],
): number | null {
  const textLuminance = relativeLuminance(textColor);
  const paletteLuminances = palette
    .map((color) => relativeLuminance(color))
    .filter((luminance): luminance is number => luminance !== null);

  if (textLuminance === null || paletteLuminances.length === 0) {
    return null;
  }

  return (
    paletteLuminances.reduce(
      (total, luminance) => total + contrastRatio(textLuminance, luminance),
      0,
    ) / paletteLuminances.length
  );
}

function getHookCaptionTheme(theme: RemotionTheme): HookCaptionTheme {
  const accentPalette = [theme.accent, theme.secondary];
  const darkTextContrast = averageContrastAgainstPalette(
    theme.background,
    accentPalette,
  );
  const lightTextContrast = averageContrastAgainstPalette(
    theme.foreground,
    accentPalette,
  );
  const useDarkText =
    darkTextContrast === null || lightTextContrast === null
      ? true
      : darkTextContrast >= lightTextContrast;
  const foregroundHighlight = rgbaFromThemeColor(
    theme.foreground,
    0.94,
    "rgba(248, 250, 252, 0.94)",
  );

  if (useDarkText) {
    const foregroundScrim = rgbaFromThemeColor(
      theme.foreground,
      0.82,
      "rgba(248, 250, 252, 0.82)",
    );
    const foregroundScrimEnd = rgbaFromThemeColor(
      theme.foreground,
      0.66,
      "rgba(248, 250, 252, 0.66)",
    );
    const foregroundLift = rgbaFromThemeColor(
      theme.foreground,
      0.48,
      "rgba(248, 250, 252, 0.48)",
    );
    const foregroundGlow = rgbaFromThemeColor(
      theme.foreground,
      0.3,
      "rgba(248, 250, 252, 0.3)",
    );
    const backgroundShade = rgbaFromThemeColor(
      theme.background,
      0.18,
      "rgba(15, 23, 42, 0.18)",
    );

    return {
      color: theme.background,
      highlightColor: foregroundHighlight,
      scrimStyle: {
        background: `linear-gradient(180deg, ${foregroundScrim}, ${foregroundScrimEnd})`,
        border: `1px solid ${backgroundShade}`,
        boxShadow: `0 24px 68px ${backgroundShade}`,
        inset: "-20px -28px",
      },
      textShadow: `0 2px 0 ${foregroundLift}, 0 14px 34px ${foregroundGlow}`,
    };
  }

  const backgroundScrim = rgbaFromThemeColor(
    theme.background,
    0.78,
    "rgba(15, 23, 42, 0.78)",
  );
  const backgroundScrimEnd = rgbaFromThemeColor(
    theme.background,
    0.62,
    "rgba(15, 23, 42, 0.62)",
  );
  const backgroundShadow = rgbaFromThemeColor(
    theme.background,
    0.72,
    "rgba(15, 23, 42, 0.72)",
  );
  const foregroundBorder = rgbaFromThemeColor(
    theme.foreground,
    0.16,
    "rgba(248, 250, 252, 0.16)",
  );

  return {
    color: theme.foreground,
    highlightColor: foregroundHighlight,
    scrimStyle: {
      background: `linear-gradient(180deg, ${backgroundScrim}, ${backgroundScrimEnd})`,
      border: `1px solid ${foregroundBorder}`,
      boxShadow: `0 24px 70px ${backgroundShadow}`,
      inset: "-20px -28px",
    },
    textShadow: `0 3px 8px ${backgroundShadow}, 0 16px 42px ${backgroundShadow}`,
  };
}

function getBeatTiming(
  musicSrc: string | null | undefined,
  fps: number,
): BeatTiming {
  const metadata = getMusicBeatMetadata(musicSrc);
  const bpm = metadata?.bpm ?? FALLBACK_BPM;
  const downbeatOffsetSec = metadata?.downbeatOffsetSec ?? 0;

  return {
    bpm,
    downbeatOffsetSec,
    framesPerBeat: beatFrames(bpm, fps),
  };
}

function getHookCutFrame({
  beatTiming,
  durationInFrames,
  fps,
}: {
  beatTiming: BeatTiming;
  durationInFrames: number;
  fps: number;
}): number {
  const ctaFrames = getCtaFrameBudget(durationInFrames);
  const latestHookCut = Math.max(24, durationInFrames - ctaFrames - 42);
  const targetFrame = Math.min(TARGET_HOOK_FRAMES, latestHookCut);
  const snapped = snapToBeat(
    targetFrame,
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "nearest",
  );

  return clamp(snapped, 24, latestHookCut);
}

function getTransitionFrames(beatTiming: BeatTiming): number {
  return clamp(Math.round(beatTiming.framesPerBeat * 0.55), 6, 10);
}

function getCtaFrameBudget(durationInFrames: number): number {
  return Math.min(
    MAX_CTA_FRAMES,
    Math.max(MIN_CTA_FRAMES, Math.round(durationInFrames * 0.16)),
  );
}

function getCtaFrames(durationInFrames: number, hookCutFrame: number): number {
  return Math.min(
    getCtaFrameBudget(durationInFrames),
    Math.max(18, durationInFrames - hookCutFrame - 36),
  );
}

function getShotStarts({
  demoFrames,
  framesPerBeat,
  shotCount,
}: {
  demoFrames: number;
  framesPerBeat: number;
  shotCount: number;
}): number[] {
  if (shotCount <= 1) {
    return [0];
  }

  const totalUsableBeats = Math.max(
    shotCount,
    Math.floor(demoFrames / framesPerBeat),
  );
  const beatsPerShot = Math.max(1, Math.floor(totalUsableBeats / shotCount));

  return Array.from({ length: shotCount }, (_, index) =>
    Math.min(
      demoFrames - 1,
      Math.max(0, Math.round(index * beatsPerShot * framesPerBeat)),
    ),
  );
}

function getActiveShotIndex(localFrame: number, starts: number[]): number {
  for (let index = starts.length - 1; index >= 0; index -= 1) {
    if (localFrame >= starts[index]) {
      return index;
    }
  }

  return 0;
}

function isVideoSource(src: string): boolean {
  return VIDEO_EXTENSION_PATTERN.test(src) || /^data:video\//iu.test(src);
}

function formatStepLabel(label: string | undefined, index: number): string {
  if (label?.trim()) {
    return label;
  }

  return `Step ${index + 1}`;
}

function isDesktopCapture(capture: HookDemoCapture): boolean {
  const marker = `${capture.label} ${capture.src}`.toLowerCase();

  return marker.includes("desktop");
}

function isVideoCapture(capture: HookDemoCapture): boolean {
  return capture.kind === "video" || isVideoSource(capture.src);
}

function ugcHookStickerLabel({
  role,
}: NonNullable<HookDemoData["ugcClip"]>): string | null {
  switch (role) {
    case "reaction":
      return "REAL REACTION";
    case "talking":
      return "CREATOR TAKE";
    case "selfie":
      return "POV";
    default:
      return null;
  }
}

function HookCard({
  beatTiming,
  hook,
  hookCutFrame,
  subhook,
  theme,
  transitionFrames,
}: {
  beatTiming: BeatTiming;
  hook: string;
  hookCutFrame: number;
  subhook: string | undefined;
  theme: RemotionTheme;
  transitionFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exitProgress = interpolate(
    frame,
    [hookCutFrame, hookCutFrame + transitionFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const pulseBeat = snapToBeat(
    frame,
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "floor",
  );
  const beatPulse = spring({
    config: {
      damping: 18,
      stiffness: 170,
    },
    fps,
    frame: frame - pulseBeat,
  });
  const words = countWords(hook);
  const wordsPerSecond = clamp(
    words / Math.max(0.7, (hookCutFrame - 6) / fps),
    2.4,
    5.2,
  );
  const hookCaptionTheme = getHookCaptionTheme(theme);
  const subhookOpacity = interpolate(
    frame,
    [Math.max(14, hookCutFrame - 30), hookCutFrame - 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        background: theme.accent,
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `linear-gradient(160deg, ${theme.accent} 0%, ${theme.secondary} 62%, ${theme.background} 150%)`,
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(105deg, rgba(255,255,255,0.28) 0 9%, transparent 9% 20%, rgba(255,255,255,0.15) 20% 28%, transparent 28% 100%)",
          inset: "-12% -28%",
          opacity: 0.32,
          position: "absolute",
          transform: `translateX(${interpolate(
            frame,
            [0, hookCutFrame + transitionFrames],
            [-170, 130],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px) rotate(-8deg) scale(${1 + Math.min(1, beatPulse) * 0.018})`,
        }}
      />
      <GrainOverlay opacity={0.16} size={180} />

      <div
        style={{
          left: 72,
          position: "absolute",
          top: TOP_SAFE + 24,
          transform: `translateX(${-exitProgress * 140}px)`,
        }}
      >
        <StickerChip
          background="#f8fafc"
          color="#111827"
          rotationDeg={-4}
          startFrame={0}
          style={{
            fontSize: 28,
            padding: "15px 22px",
          }}
        >
          Wait for it
        </StickerChip>
      </div>

      <WordCaptions
        color={hookCaptionTheme.color}
        fontFamily={`${ARCHIVO_BLACK_FONT_FAMILY}, ${remotionFontFamily}`}
        fontSize={104}
        holdLastPageUntilFrame={hookCutFrame}
        highlightColor={hookCaptionTheme.highlightColor}
        highlightMode="background"
        maxContentWidth={HOOK_CAPTION_MAX_CONTENT_WIDTH}
        maxLines={2}
        scrimStyle={hookCaptionTheme.scrimStyle}
        showScrim
        startFrame={HOOK_CAPTION_START_FRAME}
        style={{
          opacity: 1 - exitProgress * 0.35,
          top: -38,
        }}
        text={hook}
        textShadow={hookCaptionTheme.textShadow}
        wordsPerSecond={wordsPerSecond}
      />

      {subhook ? (
        <div
          style={{
            bottom: HOOK_SUBHOOK_BOTTOM,
            color: "rgba(255,255,255,0.88)",
            fontSize: 34,
            fontWeight: 800,
            left: 84,
            lineHeight: 1.08,
            maxWidth: 780,
            opacity: subhookOpacity * (1 - exitProgress),
            position: "absolute",
            right: RIGHT_SAFE + 50,
            textShadow: "0 8px 22px rgba(0,0,0,0.35)",
            transform: `translateY(${(1 - subhookOpacity) * 18}px)`,
          }}
        >
          {subhook}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function UgcHookClip({
  beatTiming,
  hook,
  hookCutFrame,
  subhook,
  theme,
  transitionFrames,
  ugcClip,
}: {
  beatTiming: BeatTiming;
  hook: string;
  hookCutFrame: number;
  subhook: string | undefined;
  theme: RemotionTheme;
  transitionFrames: number;
  ugcClip: NonNullable<HookDemoData["ugcClip"]>;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = resolveMediaSrc(ugcClip);
  const exitProgress = interpolate(
    frame,
    [hookCutFrame, hookCutFrame + transitionFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const pulseBeat = snapToBeat(
    frame,
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "floor",
  );
  const beatPulse = spring({
    config: {
      damping: 18,
      stiffness: 170,
    },
    fps,
    frame: frame - pulseBeat,
  });
  const words = countWords(hook);
  const wordsPerSecond = clamp(
    words / Math.max(0.7, (hookCutFrame - 6) / fps),
    2.6,
    5.4,
  );
  const subhookOpacity = interpolate(
    frame,
    [Math.max(14, hookCutFrame - 30), hookCutFrame - 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const stickerLabel = ugcHookStickerLabel(ugcClip);

  return (
    <AbsoluteFill
      style={{
        background: "#030712",
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <Video
        loop
        muted
        playsInline
        src={src}
        style={{
          filter: "saturate(1.08) contrast(1.04)",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${1.015 + Math.min(1, beatPulse) * 0.012})`,
          width: "100%",
        }}
        volume={0}
      />
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.06) 34%, rgba(0,0,0,0.2) 66%, rgba(0,0,0,0.68) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background: theme.accent,
          borderRadius: 999,
          bottom: 210,
          filter: "blur(28px)",
          height: 260,
          opacity: 0.2,
          position: "absolute",
          right: -110,
          width: 260,
        }}
      />
      <GrainOverlay opacity={0.11} size={180} />

      {stickerLabel ? (
        <div
          style={{
            left: 72,
            opacity: 1 - exitProgress,
            position: "absolute",
            top: TOP_SAFE + 24,
            transform: `translateX(${-exitProgress * 140}px)`,
          }}
        >
          <StickerChip
            background={theme.accent}
            color={theme.background}
            rotationDeg={-4}
            startFrame={0}
            style={{
              fontSize: 27,
              padding: "15px 22px",
            }}
          >
            {stickerLabel}
          </StickerChip>
        </div>
      ) : null}

      <WordCaptions
        color="#ffffff"
        fontFamily={`${ARCHIVO_BLACK_FONT_FAMILY}, ${remotionFontFamily}`}
        fontSize={108}
        holdLastPageUntilFrame={hookCutFrame}
        highlightColor={theme.accent}
        highlightMode="background"
        maxContentWidth={HOOK_CAPTION_MAX_CONTENT_WIDTH}
        maxLines={2}
        scrimStyle={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.24))",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
          inset: "-20px -28px",
        }}
        showScrim
        startFrame={HOOK_CAPTION_START_FRAME}
        style={{
          opacity: 1 - exitProgress * 0.35,
          top: -26,
        }}
        text={hook}
        textShadow="0 3px 10px rgba(0,0,0,0.78), 0 18px 44px rgba(0,0,0,0.68)"
        wordsPerSecond={wordsPerSecond}
      />

      {subhook ? (
        <div
          style={{
            bottom: HOOK_SUBHOOK_BOTTOM,
            color: "rgba(255,255,255,0.9)",
            fontSize: 34,
            fontWeight: 850,
            left: 84,
            lineHeight: 1.08,
            maxWidth: 780,
            opacity: subhookOpacity * (1 - exitProgress),
            position: "absolute",
            right: RIGHT_SAFE + 50,
            textShadow: "0 8px 22px rgba(0,0,0,0.52)",
            transform: `translateY(${(1 - subhookOpacity) * 18}px)`,
          }}
        >
          {subhook}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

function CaptureMedia({
  capture,
  localFrame,
  shotDuration,
}: {
  capture: HookDemoCapture;
  localFrame: number;
  shotDuration: number;
}) {
  const src = resolveMediaSrc({
    label: capture.label,
    src: capture.src,
  });
  const videoCapture = isVideoCapture(capture);
  const mediaProgress = clamp(localFrame / Math.max(1, shotDuration), 0, 1);
  const desktop = isDesktopCapture(capture);
  const scale = desktop
    ? interpolate(mediaProgress, [0, 1], [1.015, 1.075])
    : interpolate(mediaProgress, [0, 1], [1.015, 1.055]);
  const y = desktop
    ? 0
    : interpolate(mediaProgress, [0, 1], [18, -72], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  if (videoCapture) {
    return (
      <Video
        loop
        muted
        playsInline
        src={src}
        style={{
          background: "#020617",
          filter: "saturate(1.04) contrast(1.02)",
          height: "100%",
          objectFit: "cover",
          width: "100%",
        }}
        volume={0}
      />
    );
  }

  return (
    <Img
      src={src}
      style={{
        background: desktop ? "#f8fafc" : "#020617",
        filter: "saturate(1.03) contrast(1.02)",
        height: "100%",
        objectFit: desktop ? "contain" : "cover",
        transform: `translateY(${y}px) scale(${scale})`,
        width: "100%",
      }}
    />
  );
}

function ShotMedia({
  asset,
  capture,
  localFrame,
  shotDuration,
}: {
  asset: HookDemoShot["image"];
  capture?: HookDemoCapture;
  localFrame: number;
  shotDuration: number;
}) {
  if (capture) {
    return (
      <CaptureMedia
        capture={capture}
        localFrame={localFrame}
        shotDuration={shotDuration}
      />
    );
  }

  const src = resolveMediaSrc(asset);
  const mediaProgress = clamp(localFrame / Math.max(1, shotDuration), 0, 1);
  const scale = interpolate(mediaProgress, [0, 1], [1.035, 1.11]);
  const x = interpolate(mediaProgress, [0, 1], [-14, 18]);
  const y = interpolate(mediaProgress, [0, 1], [16, -18]);
  const mediaStyle = {
    filter: "saturate(1.06) contrast(1.05)",
    height: "100%",
    objectFit: "cover" as const,
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    width: "100%",
  };

  if (isVideoSource(src)) {
    return (
      <Video loop muted playsInline src={src} style={mediaStyle} volume={0} />
    );
  }

  return <Img src={src} style={mediaStyle} />;
}

function DemoShots({
  beatTiming,
  captures,
  demoFrames,
  fallbackTitle,
  hookCutFrame,
  shots,
  theme,
}: {
  beatTiming: BeatTiming;
  captures: HookDemoCapture[];
  demoFrames: number;
  fallbackTitle: string;
  hookCutFrame: number;
  shots: HookDemoShot[];
  theme: RemotionTheme;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const starts = getShotStarts({
    demoFrames,
    framesPerBeat: beatTiming.framesPerBeat,
    shotCount: shots.length,
  });
  const shotIndex = getActiveShotIndex(frame, starts);
  const shot = shots[shotIndex];
  const videoCapture = captures.find(isVideoCapture);
  const imageCaptures = captures.filter((capture) => !isVideoCapture(capture));
  const capture =
    shotIndex === 0 && videoCapture
      ? videoCapture
      : imageCaptures.length > 0
        ? imageCaptures[
            (videoCapture ? Math.max(0, shotIndex - 1) : shotIndex) %
              imageCaptures.length
          ]
        : undefined;
  const shotStart = starts[shotIndex] ?? 0;
  const nextShotStart = starts[shotIndex + 1] ?? demoFrames;
  const shotDuration = Math.max(1, nextShotStart - shotStart);
  const shotLocalFrame = Math.max(0, frame - shotStart);
  const globalFrame = frame + hookCutFrame;
  const currentBeat = snapToBeat(
    globalFrame,
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "floor",
  );
  const beatPulse = spring({
    config: {
      damping: 16,
      stiffness: 180,
    },
    fps,
    frame: globalFrame - currentBeat,
  });
  const shotEntrance = spring({
    config: {
      damping: 19,
      stiffness: 175,
    },
    fps,
    frame: shotLocalFrame,
  });
  const captionIn = spring({
    config: {
      damping: 20,
      stiffness: 150,
    },
    fps,
    frame: shotLocalFrame - 4,
  });
  const phoneTilt = interpolate(shotIndex % 2, [0, 1], [-1.2, 1.2]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${theme.background} 0%, #09090b 60%, ${theme.secondary} 150%)`,
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 100%)",
          backgroundSize: "86px 86px",
          inset: 0,
          opacity: 0.22,
          position: "absolute",
          transform: `translateX(${interpolate(
            frame,
            [0, demoFrames],
            [0, -86],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )}px)`,
        }}
      />
      <div
        style={{
          background: theme.accent,
          borderRadius: 999,
          filter: "blur(20px)",
          height: 360,
          opacity: 0.23 + Math.min(1, beatPulse) * 0.05,
          position: "absolute",
          right: -145,
          top: TOP_SAFE + 86,
          transform: `scale(${1 + Math.min(1, beatPulse) * 0.04})`,
          width: 360,
        }}
      />
      <GrainOverlay opacity={0.08} />

      <SafeArea
        style={{
          paddingLeft: 72,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            maxWidth: 790,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              color: theme.accent,
              fontSize: 28,
              fontWeight: 900,
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            {capture?.label ??
              shot.image.label ??
              formatStepLabel(shot.label, shotIndex)}
          </div>
          <div
            style={{
              color: theme.foreground,
              fontSize: 60,
              fontWeight: 950,
              lineHeight: 0.96,
              opacity: clamp(captionIn, 0, 1),
              textShadow: "0 8px 28px rgba(0,0,0,0.36)",
              transform: `translateY(${(1 - Math.min(1, captionIn)) * 26}px)`,
            }}
          >
            {shot.caption ?? fallbackTitle}
          </div>
        </div>
      </SafeArea>

      <div
        style={{
          left: 174,
          position: "absolute",
          top: TOP_SAFE + 300,
          transform: `translateY(${(1 - Math.min(1, shotEntrance)) * 76}px) rotate(${phoneTilt}deg) scale(${
            0.985 + Math.min(1, shotEntrance) * 0.015
          })`,
        }}
      >
        <PhoneFrame
          background="#020617"
          height={1060}
          screenStyle={{
            boxShadow: `inset 0 0 0 5px ${theme.accent}33`,
          }}
          width={650}
        >
          <ShotMedia
            asset={shot.image}
            capture={capture}
            localFrame={shotLocalFrame}
            shotDuration={shotDuration}
          />
          <div
            style={{
              background:
                "linear-gradient(180deg, rgba(2,6,23,0.02) 0%, rgba(2,6,23,0.44) 100%)",
              inset: 0,
              position: "absolute",
            }}
          />
          <div
            style={{
              left: 26,
              position: "absolute",
              top: 44,
            }}
          >
            <StickerChip
              background={theme.accent}
              color={theme.background}
              rotationDeg={-6}
              startFrame={shotStart + 1}
              style={{
                fontSize: 25,
                padding: "14px 19px",
              }}
            >
              {formatStepLabel(shot.label, shotIndex)}
            </StickerChip>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
}

function CtaBrandBug({
  brand,
  theme,
}: {
  brand: RemotionProps["brand"];
  theme: RemotionTheme;
}) {
  const handle = brand.handle ?? brand.name;

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: 14,
        left: 72,
        position: "absolute",
        top: TOP_SAFE + 28,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: theme.background,
          border: "3px solid rgba(255,255,255,0.92)",
          borderRadius: 999,
          color: theme.foreground,
          display: "flex",
          fontSize: 31,
          fontWeight: 950,
          height: 58,
          justifyContent: "center",
          width: 58,
        }}
      >
        {brand.name.slice(0, 1).toUpperCase()}
      </div>
      <div
        style={{
          color: theme.background,
          fontSize: 27,
          fontWeight: 900,
        }}
      >
        {handle.startsWith("@") ? handle : `@${handle}`}
      </div>
    </div>
  );
}

function EndCtaCard({
  brand,
  cta,
  startFrame,
  theme,
}: {
  brand: RemotionProps["brand"];
  cta: string;
  startFrame: number;
  theme: RemotionTheme;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - startFrame);
  const entrance = spring({
    config: {
      damping: 18,
      stiffness: 155,
    },
    fps,
    frame: localFrame,
  });
  const buttonPulse = spring({
    config: {
      damping: 8,
      stiffness: 120,
    },
    fps,
    frame: localFrame % Math.round(fps * 0.72),
  });
  const sweep = interpolate(localFrame, [0, 48], [-360, 420], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: theme.accent,
        color: theme.background,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `linear-gradient(145deg, ${theme.accent} 0%, ${theme.secondary} 82%)`,
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background: "rgba(255,255,255,0.26)",
          height: 2500,
          left: sweep,
          position: "absolute",
          top: -260,
          transform: "rotate(18deg)",
          width: 160,
        }}
      />
      <GrainOverlay opacity={0.13} size={190} />
      <CtaBrandBug brand={brand} theme={theme} />

      <SafeArea
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          paddingLeft: 72,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: `5px solid ${theme.background}`,
            borderRadius: 52,
            boxShadow:
              "0 36px 0 rgba(0,0,0,0.25), 0 60px 110px rgba(0,0,0,0.32)",
            padding: "68px 54px 62px",
            transform: `translateY(${(1 - Math.min(1, entrance)) * 90}px) rotate(${
              -1.4 + Math.min(1, entrance) * 1.4
            }deg)`,
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: `${ARCHIVO_BLACK_FONT_FAMILY}, ${remotionFontFamily}`,
              fontSize: 68,
              fontWeight: 900,
              lineHeight: 0.95,
              textTransform: "uppercase",
            }}
          >
            {cta}
          </div>
          <div
            style={{
              alignItems: "center",
              background: theme.background,
              borderRadius: 999,
              boxShadow: "0 14px 0 rgba(0,0,0,0.22)",
              color: theme.foreground,
              display: "inline-flex",
              fontSize: 37,
              fontWeight: 950,
              justifyContent: "center",
              marginTop: 42,
              minHeight: 88,
              padding: "0 42px",
              transform: `scale(${1 + Math.min(1, buttonPulse) * 0.055})`,
              transformOrigin: "center",
            }}
          >
            Save this workflow
          </div>
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
}

function MainScene({
  beatTiming,
  captures,
  cta,
  ctaFrames,
  hookCutFrame,
  props,
  shots,
  theme,
}: {
  beatTiming: BeatTiming;
  captures: HookDemoCapture[];
  cta: string;
  ctaFrames: number;
  hookCutFrame: number;
  props: RemotionProps;
  shots: HookDemoShot[];
  theme: RemotionTheme;
}) {
  const frame = useCurrentFrame();
  const mainFrames = useVideoConfig().durationInFrames - hookCutFrame;
  const ctaStartFrame = Math.max(1, mainFrames - ctaFrames);
  const demoFrames = Math.max(1, ctaStartFrame);

  if (frame >= ctaStartFrame) {
    return (
      <EndCtaCard
        brand={props.brand}
        cta={cta}
        startFrame={ctaStartFrame}
        theme={theme}
      />
    );
  }

  return (
    <DemoShots
      beatTiming={beatTiming}
      captures={captures}
      demoFrames={demoFrames}
      fallbackTitle={props.title}
      hookCutFrame={hookCutFrame}
      shots={shots}
      theme={theme}
    />
  );
}

function SafeFooter({
  beatTiming,
  durationInFrames,
  hashtags,
  theme,
}: {
  beatTiming: BeatTiming;
  durationInFrames: number;
  hashtags: string[];
  theme: RemotionTheme;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beatIndex = Math.max(
    0,
    beatIndexAtFrame(frame, beatTiming.bpm, fps, beatTiming.downbeatOffsetSec),
  );
  const beatFrame = snapToBeat(
    frame,
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "floor",
  );
  const totalBeats = Math.max(
    1,
    Math.ceil(durationInFrames / beatTiming.framesPerBeat),
  );
  const beatPhase = clamp(
    (frame - beatFrame) / Math.max(1, beatTiming.framesPerBeat),
    0,
    1,
  );
  const progress = clamp((beatIndex + beatPhase) / totalBeats, 0, 1);
  const pulse = spring({
    config: {
      damping: 12,
      stiffness: 170,
    },
    fps,
    frame: frame - beatFrame,
  });

  return (
    <SafeArea
      style={{
        display: "flex",
        justifyContent: "flex-end",
        paddingLeft: 72,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: 999,
            height: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: `linear-gradient(90deg, ${theme.foreground} 0%, ${theme.secondary} 100%)`,
              borderRadius: 999,
              boxShadow: `0 0 ${18 + Math.min(1, pulse) * 18}px rgba(248,250,252,0.55)`,
              height: "100%",
              width: `${Math.max(3, progress * 100)}%`,
            }}
          />
        </div>
        {hashtags.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {hashtags.slice(0, 5).map((hashtag) => (
              <div
                key={hashtag}
                style={{
                  background: "rgba(15,23,42,0.62)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  color: theme.foreground,
                  fontSize: 24,
                  fontWeight: 850,
                  lineHeight: 1,
                  padding: "11px 18px 12px",
                }}
              >
                {hashtag.startsWith("#") ? hashtag : `#${hashtag}`}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </SafeArea>
  );
}

export function HookDemo(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "hook_demo");
  const hookDemo = props.hookDemo;

  if (!hookDemo) {
    throw new Error("Hook-demo props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const { durationInFrames, fps } = useVideoConfig();
  const beatTiming = getBeatTiming(props.music?.src, fps);
  const hookCutFrame = getHookCutFrame({
    beatTiming,
    durationInFrames,
    fps,
  });
  const transitionFrames = getTransitionFrames(beatTiming);
  const hookSequenceFrames = hookCutFrame + transitionFrames;
  const ctaFrames = getCtaFrames(durationInFrames, hookCutFrame);
  const mainSequenceFrames = durationInFrames - hookCutFrame;
  const shots = hookDemo.shots.slice(0, MAX_DEMO_SHOTS);
  const captures = hookDemo.captures?.slice(0, MAX_DEMO_SHOTS + 1) ?? [];
  const cta = hookDemo.cta ?? "Save this demo flow";

  return (
    <AbsoluteFill
      style={{
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <Audio
        loop
        src={resolveAudioSrc(props.music?.src)}
        volume={props.music?.volume ?? 0.08}
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={hookSequenceFrames}>
          {hookDemo.ugcClip ? (
            <UgcHookClip
              beatTiming={beatTiming}
              hook={hookDemo.hook}
              hookCutFrame={hookCutFrame}
              subhook={hookDemo.subhook}
              theme={theme}
              transitionFrames={transitionFrames}
              ugcClip={hookDemo.ugcClip}
            />
          ) : (
            <HookCard
              beatTiming={beatTiming}
              hook={hookDemo.hook}
              hookCutFrame={hookCutFrame}
              subhook={hookDemo.subhook}
              theme={theme}
              transitionFrames={transitionFrames}
            />
          )}
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({
            durationInFrames: transitionFrames,
            easing: Easing.bezier(0.16, 0.84, 0.28, 1),
          })}
        />
        <TransitionSeries.Sequence durationInFrames={mainSequenceFrames}>
          <MainScene
            beatTiming={beatTiming}
            captures={captures}
            cta={cta}
            ctaFrames={ctaFrames}
            hookCutFrame={hookCutFrame}
            props={props}
            shots={shots}
            theme={theme}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <SafeFooter
        beatTiming={beatTiming}
        durationInFrames={durationInFrames}
        hashtags={props.hashtags}
        theme={theme}
      />
    </AbsoluteFill>
  );
}
