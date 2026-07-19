import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps, RemotionTheme } from "../lib/video/remotion-props";
import {
  ANTON_FONT_FAMILY,
  REMOTION_FONT_STACK,
  useRemotionFonts,
} from "./fonts";
import { resolveMediaSrc, themeOrDefault } from "./media";

export const remotionFontFamily = REMOTION_FONT_STACK;

export function useEntrance(delayInFrames = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delayInFrames);

  return {
    opacity: interpolate(localFrame, [0, 0.35 * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translateY: interpolate(localFrame, [0, 0.45 * fps], [42, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
}

export function BrandBug({ props }: { props: RemotionProps }) {
  const theme = themeOrDefault(props.theme);

  return (
    <div
      style={{
        alignItems: "center",
        color: theme.foreground,
        display: "flex",
        gap: 16,
        left: 72,
        position: "absolute",
        right: 72,
        top: 70,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: theme.accent,
          borderRadius: 18,
          color: theme.background,
          display: "flex",
          fontSize: 36,
          fontWeight: 900,
          height: 64,
          justifyContent: "center",
          width: 64,
        }}
      >
        {props.brand.name.slice(0, 1).toUpperCase()}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 850,
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {props.brand.name}
        </div>
        {props.brand.handle ? (
          <div
            style={{
              color: theme.muted,
              fontSize: 24,
              fontWeight: 650,
              marginTop: 8,
            }}
          >
            {props.brand.handle}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HashtagRow({
  hashtags,
  theme,
}: {
  hashtags: string[];
  theme: RemotionTheme;
}) {
  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        bottom: 62,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        left: 72,
        position: "absolute",
        right: 72,
      }}
    >
      {hashtags.slice(0, 5).map((hashtag) => (
        <div
          key={hashtag}
          style={{
            background: "rgba(255,255,255,0.13)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            color: theme.foreground,
            fontSize: 24,
            fontWeight: 750,
            padding: "10px 18px",
          }}
        >
          {hashtag.startsWith("#") ? hashtag : `#${hashtag}`}
        </div>
      ))}
    </div>
  );
}

export function PlaceholderImage({
  asset,
  borderRadius = 42,
  fit = "cover",
  opacity = 1,
}: {
  asset: Parameters<typeof resolveMediaSrc>[0];
  borderRadius?: number;
  fit?: "cover" | "contain";
  opacity?: number;
}) {
  return (
    <Img
      src={resolveMediaSrc(asset)}
      style={{
        borderRadius,
        height: "100%",
        objectFit: fit,
        opacity,
        width: "100%",
      }}
    />
  );
}

export function BackgroundWash({ theme }: { theme: RemotionTheme }) {
  return (
    <div
      style={{
        background: `linear-gradient(150deg, ${theme.background} 0%, #111827 46%, ${theme.secondary} 140%)`,
        inset: 0,
        position: "absolute",
      }}
    >
      <div
        style={{
          background:
            "radial-gradient(circle at 18% 16%, rgba(255,255,255,0.16), transparent 30%), radial-gradient(circle at 88% 82%, rgba(255,255,255,0.12), transparent 34%)",
          inset: 0,
          position: "absolute",
        }}
      />
    </div>
  );
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function grainSvg(seed: number): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="${seed}" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.48"/>
        </feComponentTransfer>
      </filter>
      <rect width="240" height="240" filter="url(#grain)"/>
    </svg>
  `);
}

export type GrainOverlayProps = {
  blendMode?: CSSProperties["mixBlendMode"];
  opacity?: number;
  size?: number;
  style?: CSSProperties;
};

export function GrainOverlay({
  blendMode = "overlay",
  opacity = 0.06,
  size = 240,
  style,
}: GrainOverlayProps) {
  const frame = useCurrentFrame();
  const seed = 11 + (frame % 37);

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${grainSvg(seed)}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${size}px ${size}px`,
        mixBlendMode: blendMode,
        opacity,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

export type StickerChipProps = {
  background?: string;
  children: ReactNode;
  color?: string;
  emoji?: string;
  rotationDeg?: number;
  startFrame?: number;
  style?: CSSProperties;
};

export function StickerChip({
  background = "#facc15",
  children,
  color = "#111827",
  emoji,
  rotationDeg = -3,
  startFrame = 0,
  style,
}: StickerChipProps) {
  useRemotionFonts();

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    config: {
      damping: 15,
      stiffness: 220,
    },
    fps,
    frame: frame - startFrame,
  });
  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = 0.78 + Math.min(1, pop) * 0.22;

  return (
    <div
      style={{
        alignItems: "center",
        background,
        border: "4px solid rgba(255,255,255,0.92)",
        borderRadius: 999,
        boxShadow: "0 18px 0 rgba(0,0,0,0.28), 0 26px 48px rgba(0,0,0,0.28)",
        color,
        display: "inline-flex",
        fontFamily: remotionFontFamily,
        fontSize: 34,
        fontWeight: 900,
        gap: 10,
        lineHeight: 1,
        opacity,
        padding: "18px 26px",
        textTransform: "uppercase",
        ...style,
        transform: `rotate(${rotationDeg}deg) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {emoji ? <span style={{ fontSize: "1.08em" }}>{emoji}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export type PhoneFrameProps = {
  background?: string;
  children?: ReactNode;
  height?: number;
  screenStyle?: CSSProperties;
  style?: CSSProperties;
  width?: number;
};

export function PhoneFrame({
  background = "#0f172a",
  children,
  height = 1280,
  screenStyle,
  style,
  width = 620,
}: PhoneFrameProps) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #111827 0%, #030712 100%)",
        border: "4px solid rgba(255,255,255,0.16)",
        borderRadius: 86,
        boxShadow: "0 48px 120px rgba(0,0,0,0.5)",
        boxSizing: "border-box",
        height,
        padding: 24,
        position: "relative",
        width,
        ...style,
      }}
    >
      <div
        style={{
          background: "#020617",
          borderRadius: 999,
          height: 34,
          left: "50%",
          position: "absolute",
          top: 30,
          transform: "translateX(-50%)",
          width: 170,
          zIndex: 3,
        }}
      />
      <div
        style={{
          background,
          borderRadius: 62,
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.08)",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
          ...screenStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export type MemeTextProps = {
  autoShrinkToFit?: boolean;
  children?: ReactNode;
  color?: string;
  fontSize?: number;
  maxWidth?: number | string;
  maxLines?: number;
  minFontSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  text?: string;
};

const ANTON_UNITS_PER_EM = 2048;
const DEFAULT_ANTON_ADVANCE_WIDTH = 980;
const ANTON_ADVANCE_WIDTHS: Record<string, number> = {
  " ": 480,
  '"': 878,
  "#": 1119,
  "$": 946,
  "%": 2164,
  "&": 1065,
  "'": 438,
  "(": 596,
  ")": 596,
  "+": 728,
  ",": 484,
  "-": 637,
  ".": 468,
  "/": 830,
  "0": 1012,
  "1": 677,
  "2": 1012,
  "3": 1012,
  "4": 1012,
  "5": 1012,
  "6": 1012,
  "7": 1012,
  "8": 1012,
  "9": 1012,
  ":": 495,
  "=": 637,
  "?": 1008,
  A: 994,
  B: 980,
  C: 971,
  D: 1010,
  E: 843,
  F: 817,
  G: 993,
  H: 1022,
  I: 464,
  J: 955,
  K: 967,
  L: 814,
  M: 1528,
  N: 1020,
  O: 996,
  P: 967,
  Q: 1011,
  R: 976,
  S: 945,
  T: 810,
  U: 970,
  V: 961,
  W: 1458,
  X: 991,
  Y: 914,
  Z: 840,
};

function normalizedMemeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function estimateAntonAdvance(text: string): number {
  return Array.from(text.toUpperCase()).reduce(
    (total, character) =>
      total + (ANTON_ADVANCE_WIDTHS[character] ?? DEFAULT_ANTON_ADVANCE_WIDTH),
    0,
  );
}

function longestLineLength(text: string): number {
  return text
    .split(/\n/)
    .map((line) => line.trim().length)
    .reduce((longest, length) => Math.max(longest, length), 0);
}

function fitMemeTextSize(text: string, fontSize: number): number {
  const longest = longestLineLength(text);

  if (longest <= 18) {
    return fontSize;
  }

  const scale = Math.max(0.58, Math.min(1, 18 / longest));

  return Math.round(fontSize * scale);
}

function splitMemeTextIntoLines({
  fontSize,
  maxLines,
  maxWidth,
  strokeWidth,
  text,
}: {
  fontSize: number;
  maxLines: number;
  maxWidth: number | string;
  strokeWidth: number;
  text: string;
}): string[] {
  const explicitLines = text
    .split(/\n/)
    .map((line) => normalizedMemeText(line))
    .filter(Boolean);

  if (explicitLines.length > 1 && explicitLines.length <= maxLines) {
    return explicitLines;
  }

  const normalized = normalizedMemeText(text);

  if (normalized.length === 0) {
    return [normalized];
  }

  const words = normalized.split(" ");
  const lineCount = Math.max(1, Math.min(maxLines, words.length));
  const numericMaxWidth = typeof maxWidth === "number" ? maxWidth : undefined;

  if (
    lineCount === 1 ||
    (numericMaxWidth !== undefined &&
      estimateMemeTextWidth(normalized, fontSize, strokeWidth) <=
        numericMaxWidth)
  ) {
    return [normalized];
  }

  if (numericMaxWidth === undefined && normalized.length <= 22) {
    return [normalized];
  }

  const targetAdvance = estimateAntonAdvance(normalized) / lineCount;
  const splitMemo = new Map<string, string[]>();

  function chooseLines(startIndex: number, remainingLines: number): string[] {
    const memoKey = `${startIndex}:${remainingLines}`;
    const memoized = splitMemo.get(memoKey);

    if (memoized) {
      return memoized;
    }

    if (remainingLines === 1) {
      const lines = [words.slice(startIndex).join(" ")];
      splitMemo.set(memoKey, lines);
      return lines;
    }

    const maxEnd = words.length - remainingLines + 1;
    let bestLines: string[] | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let endIndex = startIndex + 1; endIndex <= maxEnd; endIndex += 1) {
      const firstLine = words.slice(startIndex, endIndex).join(" ");
      const nextLines = chooseLines(endIndex, remainingLines - 1);
      const lines = [firstLine, ...nextLines];
      const advances = lines.map(estimateAntonAdvance);
      const widestAdvance = Math.max(...advances);
      const balancePenalty = advances.reduce(
        (total, advance) => total + Math.abs(advance - targetAdvance),
        0,
      );
      const score = widestAdvance * 1000 + balancePenalty;

      if (score < bestScore) {
        bestScore = score;
        bestLines = lines;
      }
    }

    const lines = bestLines ?? [words.slice(startIndex).join(" ")];
    splitMemo.set(memoKey, lines);

    return lines;
  }

  return chooseLines(0, lineCount);
}

function estimateMemeTextWidth(
  text: string,
  fontSize: number,
  strokeWidth: number,
): number {
  return (
    (estimateAntonAdvance(text) / ANTON_UNITS_PER_EM) * fontSize +
    strokeWidth * 2
  );
}

function fitMemeTextSizeToWidth({
  fontSize,
  lines,
  maxWidth,
  minFontSize,
  strokeWidth,
}: {
  fontSize: number;
  lines: string[];
  maxWidth: number | string;
  minFontSize?: number;
  strokeWidth: number;
}): number {
  if (typeof maxWidth !== "number") {
    return fitMemeTextSize(lines.join("\n"), fontSize);
  }

  const widestAdvance = Math.max(...lines.map(estimateAntonAdvance));

  if (widestAdvance === 0) {
    return fontSize;
  }

  const availableTextWidth = Math.max(1, maxWidth - strokeWidth * 2);
  const fittedFontSize = Math.floor(
    (availableTextWidth * ANTON_UNITS_PER_EM) / widestAdvance,
  );

  return Math.max(minFontSize ?? 1, Math.min(fontSize, fittedFontSize));
}

export function MemeText({
  autoShrinkToFit = false,
  children,
  color = "#ffffff",
  fontSize = 96,
  maxWidth = "100%",
  maxLines,
  minFontSize,
  strokeColor = "#050505",
  strokeWidth = 5,
  style,
  text,
}: MemeTextProps) {
  useRemotionFonts();

  const content = text ?? children;
  const plainText =
    typeof text === "string"
      ? text
      : typeof children === "string"
        ? children
        : "";
  const fittedLines =
    plainText.length > 0 && maxLines !== undefined
      ? splitMemeTextIntoLines({
          fontSize,
          maxLines,
          maxWidth,
          strokeWidth,
          text: plainText,
        })
      : undefined;
  const fittedText = fittedLines?.join("\n") ?? plainText;
  const fittedFontSize =
    autoShrinkToFit && fittedLines
      ? fitMemeTextSizeToWidth({
          fontSize,
          lines: fittedLines,
          maxWidth,
          minFontSize,
          strokeWidth,
        })
      : fitMemeTextSize(fittedText, fontSize);
  const renderedContent = fittedLines ? fittedLines.join("\n") : content;

  return (
    <div
      style={{
        color,
        fontFamily: `${ANTON_FONT_FAMILY}, ${remotionFontFamily}`,
        fontSize: fittedFontSize,
        fontWeight: 400,
        lineHeight: 0.92,
        margin: "0 auto",
        maxWidth,
        overflowWrap: "break-word",
        textAlign: "center",
        textShadow:
          `0 ${strokeWidth}px 0 ${strokeColor}, ` +
          `${strokeWidth}px 0 0 ${strokeColor}, ` +
          `-${strokeWidth}px 0 0 ${strokeColor}, ` +
          `0 -${strokeWidth}px 0 ${strokeColor}, ` +
          `0 14px 28px rgba(0,0,0,0.45)`,
        textTransform: "uppercase",
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        whiteSpace: fittedLines ? "pre" : "pre-wrap",
        ...style,
        ...(fittedLines
          ? {
              overflow: "visible",
              textOverflow: "clip",
            }
          : {}),
      }}
    >
      {renderedContent}
    </div>
  );
}
