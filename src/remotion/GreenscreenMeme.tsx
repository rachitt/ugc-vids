import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { getMusicBeatMetadata, snapToBeat } from "./beats";
import { BOTTOM_SAFE, RIGHT_SAFE, TOP_SAFE } from "./layout";
import { resolveAudioSrc, resolveMediaSrc, themeOrDefault } from "./media";
import {
  GrainOverlay,
  MemeText,
  remotionFontFamily,
  StickerChip,
} from "./primitives";
import { parseCompositionProps } from "./props";

const CAPTION_BAR_HEIGHT = 236;
const CAPTION_BAR_BOTTOM = BOTTOM_SAFE + 24;
const CAPTION_MAX_LINES = 3;
const PERSONA_WIDTH = 860;
const PERSONA_HEIGHT = 1120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function captionFontSize(text: string): number {
  return clamp(62 - Math.max(0, text.length - 44) * 0.42, 36, 62);
}

export function GreenscreenMeme(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "greenscreen_meme");
  const meme = props.greenscreenMeme;

  if (!meme) {
    throw new Error("Greenscreen meme props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const musicBeats = getMusicBeatMetadata(props.music?.src);
  const firstDownbeatFrame = musicBeats
    ? Math.max(
        0,
        snapToBeat(
          0,
          musicBeats.bpm,
          fps,
          musicBeats.downbeatOffsetSec,
          "ceil",
        ),
      )
    : 0;
  const stickerStartFrame = musicBeats
    ? clamp(
        snapToBeat(
          durationInFrames * 0.52,
          musicBeats.bpm,
          fps,
          musicBeats.downbeatOffsetSec,
          "nearest",
        ),
        Math.round(durationInFrames * 0.34),
        Math.max(Math.round(durationInFrames * 0.34), durationInFrames - 42),
      )
    : Math.round(durationInFrames * 0.52);
  const cutoutEntrance = spring({
    config: {
      damping: 13,
      stiffness: 210,
    },
    fps,
    frame,
    durationInFrames: 12,
  });
  const idleBob = Math.sin(frame / 9) * 6;
  const titlePop = spring({
    config: {
      damping: 12,
      stiffness: 260,
    },
    fps,
    frame: frame - firstDownbeatFrame,
    durationInFrames: 11,
  });
  const titleProgress = Math.min(1, titlePop);
  const titleOpacity = interpolate(
    frame,
    [firstDownbeatFrame, firstDownbeatFrame + 5],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const captionPop = spring({
    config: {
      damping: 17,
      stiffness: 210,
    },
    fps,
    frame: frame - 18,
    durationInFrames: 14,
  });
  const captionOpacity = interpolate(frame, [16, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const backgroundScale = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [1, 1.08],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const bandColor = meme.captionBar ?? theme.background ?? "#050505";

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
      <Img
        src={resolveMediaSrc(meme.background)}
        style={{
          filter: "saturate(1.08) contrast(1.04)",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${backgroundScale})`,
          width: "100%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 28%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.7) 100%)",
          inset: 0,
          position: "absolute",
          zIndex: 1,
        }}
      />

      <div
        style={{
          left: 56,
          opacity: titleOpacity,
          position: "absolute",
          right: RIGHT_SAFE + 56,
          top: TOP_SAFE,
          transform: `translateY(${(1 - titleProgress) * 22}px) scale(${
            0.82 + titleProgress * 0.18
          })`,
          transformOrigin: "center top",
          zIndex: 6,
        }}
      >
        <MemeText
          autoShrinkToFit
          fontSize={112}
          maxLines={2}
          maxWidth={900}
          strokeWidth={6}
          text={props.title}
        />
      </div>

      {meme.reactionLabel ? (
        <div
          style={{
            left: 90,
            position: "absolute",
            top: 650,
            zIndex: 7,
          }}
        >
          <StickerChip
            background={theme.accent}
            color={theme.background}
            rotationDeg={-5}
            startFrame={stickerStartFrame}
            style={{
              fontSize: 32,
              maxWidth: 640,
              textAlign: "center",
            }}
          >
            {meme.reactionLabel}
          </StickerChip>
        </div>
      ) : null}

      <div
        style={{
          bottom: BOTTOM_SAFE + CAPTION_BAR_HEIGHT - 76,
          height: PERSONA_HEIGHT,
          left: "50%",
          position: "absolute",
          transform: `translateX(-50%) translateY(${
            (1 - cutoutEntrance) * 260 + idleBob
          }px) scale(${0.91 + cutoutEntrance * 0.09})`,
          transformOrigin: "center bottom",
          width: PERSONA_WIDTH,
          zIndex: 4,
        }}
      >
        <div
          style={{
            height: "100%",
            transform: `rotate(${Math.sin(frame / 31) * 0.8}deg)`,
            transformOrigin: "center bottom",
            width: "100%",
          }}
        >
          <Img
            src={resolveMediaSrc(meme.persona)}
            style={{
              filter:
                "drop-shadow(0 44px 50px rgba(0,0,0,0.56)) drop-shadow(0 0 18px rgba(255,255,255,0.18))",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center bottom",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: bandColor,
          bottom: CAPTION_BAR_BOTTOM,
          boxShadow: "0 -20px 54px rgba(0,0,0,0.32)",
          boxSizing: "border-box",
          height: CAPTION_BAR_HEIGHT,
          left: 0,
          opacity: captionOpacity,
          padding: `30px ${RIGHT_SAFE + 72}px 34px 72px`,
          position: "absolute",
          right: 0,
          transform: `scaleY(${0.88 + captionPop * 0.12})`,
          transformOrigin: "center bottom",
          zIndex: 8,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            display: "-webkit-box",
            fontFamily: remotionFontFamily,
            fontSize: captionFontSize(meme.caption),
            fontWeight: 700,
            lineHeight: 1.02,
            overflow: "hidden",
            textAlign: "center",
            textShadow: "0 4px 18px rgba(0,0,0,0.34)",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: CAPTION_MAX_LINES,
          }}
        >
          {meme.caption}
        </div>
      </div>

      <GrainOverlay
        blendMode="overlay"
        opacity={0.075}
        size={180}
        style={{ zIndex: 20 }}
      />
    </AbsoluteFill>
  );
}
