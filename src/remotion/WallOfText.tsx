import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { beatFrames, getMusicBeatMetadata, snapToBeat } from "./beats";
import { useRemotionFonts } from "./fonts";
import { BOTTOM_SAFE, RIGHT_SAFE, TOP_SAFE } from "./layout";
import { resolveAudioSrc, resolveMediaSrc, themeOrDefault } from "./media";
import { GrainOverlay, remotionFontFamily } from "./primitives";
import { parseCompositionProps } from "./props";

const DEFAULT_TIMESTAMP_LABEL = "2h";
const DEFAULT_FOOTER_CUE = "save this 🔖";
const CARD_LEFT = 58;
const CARD_RIGHT = RIGHT_SAFE + 40;
const CARD_TOP = TOP_SAFE + 14;
const FOOTER_HEIGHT = 82;
const FOOTER_BOTTOM = BOTTOM_SAFE + 52;
const FOOTER_GAP = 42;
const LINE_STAGGER_FRAMES = 6;

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHandle(
  brandName: string,
  handle: string | undefined,
): string {
  if (handle) {
    return handle.startsWith("@") ? handle : `@${handle}`;
  }

  const fallback = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");

  return fallback ? `@${fallback}` : "@brand";
}

function getBeatTiming(
  musicSrc: string | undefined,
  fps: number,
): {
  bpm: number;
  downbeatOffsetSec: number;
  framesPerBeat: number;
} {
  const metadata = getMusicBeatMetadata(musicSrc);
  const bpm = metadata?.bpm ?? 82;
  const downbeatOffsetSec = metadata?.downbeatOffsetSec ?? 0;

  return {
    bpm,
    downbeatOffsetSec,
    framesPerBeat: beatFrames(bpm, fps),
  };
}

function framesSinceLastBeat(
  frame: number,
  framesPerBeat: number,
  downbeatOffsetFrame: number,
): number {
  const localFrame = frame - downbeatOffsetFrame;

  if (localFrame <= 0) {
    return 0;
  }

  return localFrame % framesPerBeat;
}

export function WallOfText(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "wall_of_text");
  const wall = props.wallOfText;

  if (!wall) {
    throw new Error("Wall-of-text props are missing.");
  }

  useRemotionFonts();

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps, height } = useVideoConfig();
  const broll = wall.broll[0];
  const beatTiming = getBeatTiming(props.music?.src, fps);
  const downbeatOffsetFrame = beatTiming.downbeatOffsetSec * fps;
  const cardEntranceFrame = Math.max(
    0,
    snapToBeat(4, beatTiming.bpm, fps, beatTiming.downbeatOffsetSec, "floor"),
  );
  const lineRevealFrame = Math.max(
    cardEntranceFrame + 10,
    snapToBeat(
      Math.round(cardEntranceFrame + beatTiming.framesPerBeat * 0.9),
      beatTiming.bpm,
      fps,
      beatTiming.downbeatOffsetSec,
      "ceil",
    ),
  );
  const lineSpringDuration = Math.round(
    clamp(beatTiming.framesPerBeat * 0.86, 18, 24),
  );
  const bodyLines = wall.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const textLines = [wall.headline, ...bodyLines];
  const wallCompleteLimitFrame = snapToBeat(
    Math.round(durationInFrames * 0.7),
    beatTiming.bpm,
    fps,
    beatTiming.downbeatOffsetSec,
    "floor",
  );
  const maxStaggerForDuration =
    textLines.length > 1
      ? Math.floor(
          (wallCompleteLimitFrame - lineRevealFrame - lineSpringDuration) /
            (textLines.length - 1),
        )
      : LINE_STAGGER_FRAMES;
  const lineStagger = clamp(maxStaggerForDuration, 2, LINE_STAGGER_FRAMES);
  const naturalCompleteFrame =
    lineRevealFrame + (textLines.length - 1) * lineStagger + lineSpringDuration;
  const finalSettleFrame = Math.min(
    wallCompleteLimitFrame,
    snapToBeat(
      naturalCompleteFrame,
      beatTiming.bpm,
      fps,
      beatTiming.downbeatOffsetSec,
      "ceil",
    ),
  );
  const cardEntrance = clamp(
    spring({
      config: {
        damping: 18,
        stiffness: 140,
      },
      durationInFrames: Math.round(beatTiming.framesPerBeat * 1.15),
      fps,
      frame: frame - cardEntranceFrame,
    }),
  );
  const settlePulse = clamp(
    spring({
      config: {
        damping: 10,
        stiffness: 220,
      },
      durationInFrames: Math.round(beatTiming.framesPerBeat * 0.7),
      fps,
      frame: frame - finalSettleFrame,
    }),
  );
  const cardSettleScale = interpolate(settlePulse, [0, 0.38, 1], [0, 0.01, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const backgroundScale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beatPulse = clamp(
    spring({
      config: {
        damping: 9,
        stiffness: 260,
      },
      durationInFrames: Math.round(beatTiming.framesPerBeat * 0.66),
      fps,
      frame: framesSinceLastBeat(
        Math.max(0, frame - finalSettleFrame),
        beatTiming.framesPerBeat,
        downbeatOffsetFrame,
      ),
    }),
  );
  const footerEntrance = clamp(
    spring({
      config: {
        damping: 16,
        stiffness: 190,
      },
      durationInFrames: Math.round(beatTiming.framesPerBeat * 0.9),
      fps,
      frame: frame - finalSettleFrame,
    }),
  );
  const footerPulseScale =
    1 +
    interpolate(beatPulse, [0, 0.42, 1], [0, 0.075, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const timestampLabel = wall.timestampLabel ?? DEFAULT_TIMESTAMP_LABEL;
  const footerCue = wall.footerCue ?? DEFAULT_FOOTER_CUE;
  const brandHandle = normalizeHandle(props.brand.name, props.brand.handle);
  const avatarInitial = props.brand.name.slice(0, 1).toUpperCase();
  const bodyFontSize = textLines.length >= 8 ? 42 : 44;
  const hookFontSize = textLines.length >= 8 ? 54 : 58;
  const cardMaxHeight =
    height - CARD_TOP - (FOOTER_BOTTOM + FOOTER_HEIGHT + FOOTER_GAP);

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
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
      {broll ? (
        <Img
          src={resolveMediaSrc(broll)}
          style={{
            bottom: -86,
            filter: "blur(26px) saturate(1.22) brightness(0.74)",
            height: "calc(100% + 172px)",
            left: -86,
            objectFit: "cover",
            position: "absolute",
            right: -86,
            top: -86,
            transform: `scale(${backgroundScale})`,
            width: "calc(100% + 172px)",
          }}
        />
      ) : (
        <div
          style={{
            background: `linear-gradient(145deg, ${theme.background} 0%, ${theme.secondary} 54%, ${theme.accent} 130%)`,
            bottom: -86,
            filter: "blur(20px) saturate(1.14)",
            left: -86,
            position: "absolute",
            right: -86,
            top: -86,
            transform: `scale(${backgroundScale})`,
          }}
        />
      )}
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.34) 48%, rgba(2,6,23,0.62) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background:
            "radial-gradient(circle at 18% 16%, rgba(255,255,255,0.28), transparent 28%), radial-gradient(circle at 82% 88%, rgba(255,255,255,0.18), transparent 34%)",
          inset: 0,
          opacity: 0.5,
          position: "absolute",
        }}
      />
      <GrainOverlay opacity={0.075} size={220} />

      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 34,
          boxShadow:
            "0 34px 88px rgba(15,23,42,0.32), 0 8px 24px rgba(15,23,42,0.16)",
          boxSizing: "border-box",
          color: "#0f172a",
          left: CARD_LEFT,
          maxHeight: cardMaxHeight,
          opacity: interpolate(cardEntrance, [0, 0.82], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          overflow: "hidden",
          padding: "38px 36px 42px",
          position: "absolute",
          right: CARD_RIGHT,
          top: CARD_TOP,
          transform: `translateY(${(1 - cardEntrance) * 38}px) scale(${
            0.965 + cardEntrance * 0.035 + cardSettleScale
          })`,
          transformOrigin: "center top",
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            gap: 18,
            marginBottom: 34,
            minWidth: 0,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: theme.accent,
              borderRadius: 999,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.38)",
              color: theme.background,
              display: "flex",
              flexShrink: 0,
              fontSize: 32,
              fontWeight: 900,
              height: 68,
              justifyContent: "center",
              lineHeight: 1,
              width: 68,
            }}
          >
            {avatarInitial}
          </div>
          <div style={{ minWidth: 0, paddingTop: 4 }}>
            <div
              style={{
                alignItems: "baseline",
                display: "flex",
                flexWrap: "wrap",
                gap: "0 9px",
                lineHeight: 1.08,
              }}
            >
              <span
                style={{
                  color: "#0f172a",
                  fontSize: 33,
                  fontWeight: 900,
                }}
              >
                {props.brand.name}
              </span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 28,
                  fontWeight: 650,
                }}
              >
                {brandHandle}
              </span>
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                ·
              </span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 28,
                  fontWeight: 650,
                }}
              >
                {timestampLabel}
              </span>
            </div>
            {wall.sourceLabel ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginTop: 10,
                }}
              >
                {wall.sourceLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: textLines.length >= 8 ? 15 : 18,
          }}
        >
          {textLines.map((line, index) => {
            const start = lineRevealFrame + index * lineStagger;
            const lineSpring = clamp(
              spring({
                config: {
                  damping: 20,
                  stiffness: 190,
                },
                durationInFrames: lineSpringDuration,
                fps,
                frame: frame - start,
              }),
            );
            const opacity = interpolate(lineSpring, [0, 0.78], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isHook = index === 0;

            return (
              <div
                key={`${line}-${index}`}
                style={{
                  color: isHook ? "#0f172a" : "#1f2937",
                  fontSize: isHook ? hookFontSize : bodyFontSize,
                  fontWeight: isHook ? 900 : 700,
                  lineHeight: isHook ? 1.04 : 1.13,
                  opacity,
                  overflowWrap: "break-word",
                  transform: `translateY(${interpolate(
                    lineSpring,
                    [0, 1],
                    [12, 0],
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    },
                  )}px)`,
                  whiteSpace: "pre-wrap",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        {props.hashtags.length > 0 ? (
          <div
            style={{
              color: "#64748b",
              fontSize: 27,
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: 32,
            }}
          >
            {props.hashtags
              .slice(0, 3)
              .map((hashtag) =>
                hashtag.startsWith("#") ? hashtag : `#${hashtag}`,
              )
              .join("  ")}
          </div>
        ) : null}
      </div>

      <div
        style={{
          alignItems: "center",
          bottom: FOOTER_BOTTOM,
          display: "flex",
          height: FOOTER_HEIGHT,
          justifyContent: "center",
          left: CARD_LEFT,
          opacity: interpolate(footerEntrance, [0, 0.7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          position: "absolute",
          right: CARD_RIGHT,
          transform: `translateY(${(1 - footerEntrance) * 18}px) scale(${footerPulseScale})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(255,255,255,0.72)",
            borderRadius: 999,
            boxShadow: "0 16px 52px rgba(15,23,42,0.26)",
            color: "#0f172a",
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1,
            padding: "21px 30px",
          }}
        >
          {footerCue}
        </div>
      </div>
    </AbsoluteFill>
  );
}
