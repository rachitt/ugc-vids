import type { CSSProperties } from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { REMOTION_FONT_STACK, useRemotionFonts } from "./fonts";

const DEFAULT_WORDS_PER_SECOND = 5.5;
const DEFAULT_MAX_LINES = 2;
const DEFAULT_CAPTION_FONT_SIZE = 68;
const DEFAULT_HORIZONTAL_PADDING = 90;
const DEFAULT_MAX_CONTENT_WIDTH = 1080 - DEFAULT_HORIZONTAL_PADDING * 2;
const CAPTION_FONT_WEIGHT = 900;
const WORD_MARGIN_X_EM = 0.06;
const WORD_PADDING_X_EM = 0.18;
const DEFAULT_TEXT_SHADOW =
  "0 2px 4px rgba(0,0,0,0.52), 0 8px 24px rgba(0,0,0,0.38), 0 0 2px rgba(0,0,0,0.72)";
const DEFAULT_SCRIM_STYLE: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.2))",
  borderRadius: 28,
  inset: "-18px -24px",
  position: "absolute",
};

export type WordCaptionToken = {
  index: number;
  text: string;
  startFrame: number;
  endFrame: number;
};

export type WordCaptionPage = {
  index: number;
  startFrame: number;
  endFrame: number;
  words: WordCaptionToken[];
  lines: WordCaptionToken[][];
};

export type WordCaptionTimingOptions = {
  text: string;
  startFrame: number;
  fps: number;
  fontFamily?: string;
  fontSize?: number;
  maxContentWidth?: number;
  wordsPerSecond?: number;
  maxLines?: number;
};

export type WordCaptionTimeline = {
  pages: WordCaptionPage[];
  words: WordCaptionToken[];
};

export type WordCaptionsProps = {
  text: string;
  startFrame: number;
  wordsPerSecond?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  highlightMode?: "background" | "color";
  holdLastPageUntilFrame?: number;
  maxContentWidth?: number;
  maxLines?: number;
  scrimStyle?: CSSProperties;
  showScrim?: boolean;
  style?: CSSProperties;
  textShadow?: CSSProperties["textShadow"];
};

type WordCaptionLayoutOptions = {
  fontFamily?: string;
  fontSize?: number;
  maxContentWidth?: number;
};

type NormalizedWordCaptionLayout = {
  fontFamily: string;
  fontSize: number;
  maxContentWidth: number;
};

let measureContext: CanvasRenderingContext2D | null | undefined;

function normalizeWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function wordWeight(word: string): number {
  const letterCount = word.replace(/[^\p{L}\p{N}]/gu, "").length;

  return 0.86 + Math.min(14, Math.max(1, letterCount)) * 0.035;
}

function normalizePositiveNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeCaptionLayout({
  fontFamily = REMOTION_FONT_STACK,
  fontSize = DEFAULT_CAPTION_FONT_SIZE,
  maxContentWidth = DEFAULT_MAX_CONTENT_WIDTH,
}: WordCaptionLayoutOptions): NormalizedWordCaptionLayout {
  const normalizedFontFamily =
    fontFamily.trim().length > 0 ? fontFamily : REMOTION_FONT_STACK;

  return {
    fontFamily: normalizedFontFamily,
    fontSize: normalizePositiveNumber(fontSize, DEFAULT_CAPTION_FONT_SIZE),
    maxContentWidth: normalizePositiveNumber(
      maxContentWidth,
      DEFAULT_MAX_CONTENT_WIDTH,
    ),
  };
}

function getMeasureContext() {
  if (typeof document === "undefined") {
    return null;
  }

  measureContext ??= document.createElement("canvas").getContext("2d");

  return measureContext;
}

function formatCanvasFontFamily(fontFamily: string) {
  return fontFamily
    .split(",")
    .map((family) => family.trim())
    .filter(Boolean)
    .map((family) => {
      const isQuoted = /^(['"]).*\1$/u.test(family);
      const canBeUnquoted = /^-?[_a-zA-Z][-_a-zA-Z0-9]*$/u.test(family);

      if (isQuoted || canBeUnquoted) {
        return family;
      }

      return `"${family.replace(/"/g, '\\"')}"`;
    })
    .join(", ");
}

function fallbackTextWidth(text: string, fontSize: number) {
  return Array.from(text).reduce((total, character) => {
    if (/[MW@#%&]/u.test(character)) {
      return total + fontSize * 0.8;
    }

    if (/[ilI!|.,']/u.test(character)) {
      return total + fontSize * 0.34;
    }

    return total + fontSize * 0.64;
  }, 0);
}

function measureTextWidth(
  text: string,
  layout: NormalizedWordCaptionLayout,
) {
  const context = getMeasureContext();

  if (!context) {
    return fallbackTextWidth(text, layout.fontSize);
  }

  context.font = `${CAPTION_FONT_WEIGHT} ${layout.fontSize}px ${formatCanvasFontFamily(
    layout.fontFamily,
  )}`;

  return context.measureText(text).width;
}

function wordOuterWidth(
  word: WordCaptionToken,
  layout: NormalizedWordCaptionLayout,
) {
  return (
    measureTextWidth(word.text.toUpperCase(), layout) +
    layout.fontSize * (WORD_PADDING_X_EM * 2 + WORD_MARGIN_X_EM * 2)
  );
}

function lineWidth(
  line: WordCaptionToken[],
  layout: NormalizedWordCaptionLayout,
) {
  return line.reduce((total, word) => total + wordOuterWidth(word, layout), 0);
}

function widestLineWidth(
  lines: WordCaptionToken[][],
  layout: NormalizedWordCaptionLayout,
) {
  return lines.reduce(
    (widest, line) => Math.max(widest, lineWidth(line, layout)),
    0,
  );
}

function fitFontSizeForLines(
  lines: WordCaptionToken[][],
  layout: NormalizedWordCaptionLayout,
) {
  if (lines.length === 0) {
    return layout.fontSize;
  }

  if (widestLineWidth(lines, layout) <= layout.maxContentWidth) {
    return layout.fontSize;
  }

  let low = 1;
  let high = layout.fontSize;

  for (let index = 0; index < 12; index += 1) {
    const candidateFontSize = (low + high) / 2;
    const candidateLayout = {
      ...layout,
      fontSize: candidateFontSize,
    };

    if (widestLineWidth(lines, candidateLayout) <= layout.maxContentWidth) {
      low = candidateFontSize;
    } else {
      high = candidateFontSize;
    }
  }

  return Math.max(1, Math.min(layout.fontSize, Number(low.toFixed(3))));
}

function buildWords({
  fps,
  startFrame,
  text,
  wordsPerSecond = DEFAULT_WORDS_PER_SECOND,
}: Required<Pick<WordCaptionTimingOptions, "fps" | "startFrame" | "text">> &
  Pick<WordCaptionTimingOptions, "wordsPerSecond">): WordCaptionToken[] {
  const words = normalizeWords(text);

  if (words.length === 0) {
    return [];
  }

  const normalizedWordsPerSecond = Number.isFinite(wordsPerSecond)
    ? Math.max(1, wordsPerSecond)
    : DEFAULT_WORDS_PER_SECOND;
  const totalDurationInFrames = (words.length / normalizedWordsPerSecond) * fps;
  const weights = words.map(wordWeight);
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let cursor = startFrame;

  return words.map((word, index) => {
    const duration =
      totalWeight > 0
        ? (weights[index] / totalWeight) * totalDurationInFrames
        : totalDurationInFrames / words.length;
    const token: WordCaptionToken = {
      endFrame: cursor + duration,
      index,
      startFrame: cursor,
      text: word,
    };

    cursor += duration;

    return token;
  });
}

function createPage(index: number, lines: WordCaptionToken[][]): WordCaptionPage {
  const words = lines.flat();
  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  return {
    endFrame: lastWord.endFrame,
    index,
    lines,
    startFrame: firstWord.startFrame,
    words,
  };
}

function paginateWords(
  words: WordCaptionToken[],
  maxLines = DEFAULT_MAX_LINES,
  layoutOptions: WordCaptionLayoutOptions = {},
): WordCaptionPage[] {
  const normalizedMaxLines = Math.max(1, Math.floor(maxLines));
  const layout = normalizeCaptionLayout(layoutOptions);
  const pages: WordCaptionPage[] = [];
  let lines: WordCaptionToken[][] = [[]];
  let currentLineWidth = 0;

  for (const word of words) {
    let currentLine = lines[lines.length - 1];
    const nextWordWidth = wordOuterWidth(word, layout);

    if (
      currentLine.length > 0 &&
      currentLineWidth + nextWordWidth > layout.maxContentWidth
    ) {
      if (lines.length >= normalizedMaxLines) {
        pages.push(createPage(pages.length, lines));
        lines = [[]];
      } else {
        lines.push([]);
      }

      currentLine = lines[lines.length - 1];
      currentLineWidth = 0;
    }

    currentLine.push(word);
    currentLineWidth += nextWordWidth;
  }

  const nonEmptyLines = lines.filter((line) => line.length > 0);

  if (nonEmptyLines.length > 0) {
    pages.push(createPage(pages.length, nonEmptyLines));
  }

  return pages;
}

export function buildWordCaptionTimeline({
  fps,
  fontFamily = REMOTION_FONT_STACK,
  fontSize = DEFAULT_CAPTION_FONT_SIZE,
  maxLines = DEFAULT_MAX_LINES,
  maxContentWidth = DEFAULT_MAX_CONTENT_WIDTH,
  startFrame,
  text,
  wordsPerSecond = DEFAULT_WORDS_PER_SECOND,
}: WordCaptionTimingOptions): WordCaptionTimeline {
  const words = buildWords({
    fps,
    startFrame,
    text,
    wordsPerSecond,
  });

  return {
    pages: paginateWords(words, maxLines, {
      fontFamily,
      fontSize,
      maxContentWidth,
    }),
    words,
  };
}

export const deriveWordCaptionTimings = buildWordCaptionTimeline;

export function WordCaptions({
  color = "#ffffff",
  fontFamily = REMOTION_FONT_STACK,
  fontSize: requestedFontSize = DEFAULT_CAPTION_FONT_SIZE,
  highlightColor = "#facc15",
  highlightMode = "background",
  holdLastPageUntilFrame,
  maxContentWidth,
  maxLines = DEFAULT_MAX_LINES,
  scrimStyle,
  showScrim = false,
  startFrame,
  style,
  text,
  textShadow = DEFAULT_TEXT_SHADOW,
  wordsPerSecond = DEFAULT_WORDS_PER_SECOND,
}: WordCaptionsProps) {
  useRemotionFonts();

  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const layout = useMemo(
    () =>
      normalizeCaptionLayout({
        fontFamily,
        fontSize: requestedFontSize,
        maxContentWidth: normalizePositiveNumber(
          maxContentWidth,
          Math.max(1, width - DEFAULT_HORIZONTAL_PADDING * 2),
        ),
      }),
    [fontFamily, maxContentWidth, requestedFontSize, width],
  );
  const timeline = useMemo(
    () =>
      buildWordCaptionTimeline({
        fps,
        fontFamily: layout.fontFamily,
        fontSize: layout.fontSize,
        maxLines,
        maxContentWidth: layout.maxContentWidth,
        startFrame,
        text,
        wordsPerSecond,
      }),
    [
      fps,
      layout.fontFamily,
      layout.fontSize,
      layout.maxContentWidth,
      maxLines,
      startFrame,
      text,
      wordsPerSecond,
    ],
  );
  const activePage = timeline.pages.find(
    (candidate) => frame >= candidate.startFrame && frame < candidate.endFrame,
  );
  const lastPage = timeline.pages[timeline.pages.length - 1];
  const normalizedHoldFrame =
    typeof holdLastPageUntilFrame === "number" &&
    Number.isFinite(holdLastPageUntilFrame)
      ? holdLastPageUntilFrame
      : null;
  const page =
    activePage ??
    (lastPage &&
    normalizedHoldFrame !== null &&
    frame >= lastPage.endFrame &&
    frame <= normalizedHoldFrame
      ? lastPage
      : null);
  const fittedFontSize = useMemo(
    () => (page ? fitFontSizeForLines(page.lines, layout) : layout.fontSize),
    [layout, page],
  );

  if (!page) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          alignItems: "center",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          fontFamily: layout.fontFamily,
          fontSize: fittedFontSize,
          fontWeight: CAPTION_FONT_WEIGHT,
          gap: Math.max(10, fittedFontSize * 0.12),
          lineHeight: 1,
          maxWidth: layout.maxContentWidth,
          position: "relative",
          textAlign: "center",
          textTransform: "uppercase",
          width: "100%",
        }}
      >
        {showScrim ? (
          <div
            style={{
              ...DEFAULT_SCRIM_STYLE,
              ...scrimStyle,
            }}
          />
        ) : null}
        {page.lines.map((line, lineIndex) => (
          <div
            key={`${page.index}-${lineIndex}`}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              justifyContent: "center",
              maxWidth: "100%",
              minHeight: fittedFontSize * 1.08,
              position: "relative",
              width: "100%",
            }}
          >
            {line.map((word) => {
              const entrance = spring({
                config: {
                  damping: 18,
                  stiffness: 220,
                },
                fps,
                frame: frame - word.startFrame,
              });
              const opacity = interpolate(
                frame,
                [word.startFrame, word.startFrame + 5],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              );
              const isActive =
                frame >= word.startFrame && frame < word.endFrame;
              const scale = interpolate(
                Math.min(1, entrance),
                [0, 1],
                [0.85, 1],
              );

              return (
                <span
                  key={word.index}
                  style={{
                    background:
                      isActive && highlightMode === "background"
                        ? highlightColor
                        : "transparent",
                    borderRadius: 14,
                    color:
                      isActive && highlightMode === "color"
                        ? highlightColor
                        : isActive
                          ? "#111827"
                          : color,
                    display: "inline-block",
                    margin: `0 ${WORD_MARGIN_X_EM}em`,
                    opacity,
                    padding: `0.05em ${WORD_PADDING_X_EM}em 0.08em`,
                    textShadow:
                      isActive && highlightMode === "background"
                        ? "none"
                        : textShadow,
                    transform: `scale(${scale})`,
                    transformOrigin: "center bottom",
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}
