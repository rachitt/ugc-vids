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
const WORDS_PER_LINE = 5;
const MAX_LINE_CHARS = 24;

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
  maxLines?: number;
  style?: CSSProperties;
};

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

function currentLineLength(line: WordCaptionToken[]): number {
  return line.reduce((total, word) => total + word.text.length, 0);
}

function shouldStartNewLine(
  line: WordCaptionToken[],
  nextWord: WordCaptionToken,
): boolean {
  if (line.length === 0) {
    return false;
  }

  const nextLength = currentLineLength(line) + line.length + nextWord.text.length;

  return (
    line.length >= WORDS_PER_LINE ||
    (line.length >= 3 && nextLength > MAX_LINE_CHARS)
  );
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
): WordCaptionPage[] {
  const normalizedMaxLines = Math.max(1, Math.floor(maxLines));
  const pages: WordCaptionPage[] = [];
  let lines: WordCaptionToken[][] = [[]];

  for (const word of words) {
    let currentLine = lines[lines.length - 1];

    if (shouldStartNewLine(currentLine, word)) {
      if (lines.length >= normalizedMaxLines) {
        pages.push(createPage(pages.length, lines));
        lines = [[]];
      } else {
        lines.push([]);
      }

      currentLine = lines[lines.length - 1];
    }

    currentLine.push(word);
  }

  const nonEmptyLines = lines.filter((line) => line.length > 0);

  if (nonEmptyLines.length > 0) {
    pages.push(createPage(pages.length, nonEmptyLines));
  }

  return pages;
}

export function buildWordCaptionTimeline({
  fps,
  maxLines = DEFAULT_MAX_LINES,
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
    pages: paginateWords(words, maxLines),
    words,
  };
}

export const deriveWordCaptionTimings = buildWordCaptionTimeline;

export function WordCaptions({
  color = "#ffffff",
  fontFamily = REMOTION_FONT_STACK,
  fontSize = 68,
  highlightColor = "#facc15",
  highlightMode = "background",
  maxLines = DEFAULT_MAX_LINES,
  startFrame,
  style,
  text,
  wordsPerSecond = DEFAULT_WORDS_PER_SECOND,
}: WordCaptionsProps) {
  useRemotionFonts();

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(
    () =>
      buildWordCaptionTimeline({
        fps,
        maxLines,
        startFrame,
        text,
        wordsPerSecond,
      }),
    [fps, maxLines, startFrame, text, wordsPerSecond],
  );
  const page = timeline.pages.find(
    (candidate) => frame >= candidate.startFrame && frame < candidate.endFrame,
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
          display: "flex",
          flexDirection: "column",
          fontFamily,
          fontSize,
          fontWeight: 900,
          gap: Math.max(10, fontSize * 0.12),
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {page.lines.map((line, lineIndex) => (
          <div
            key={`${page.index}-${lineIndex}`}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              justifyContent: "center",
              minHeight: fontSize * 1.08,
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
                    margin: "0 4px",
                    opacity,
                    padding: "0.05em 0.18em 0.08em",
                    textShadow:
                      isActive && highlightMode === "background"
                        ? "none"
                        : "0 3px 0 rgba(0,0,0,0.65), 0 8px 22px rgba(0,0,0,0.48)",
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
