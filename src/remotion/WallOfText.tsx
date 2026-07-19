import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { resolveAudioSrc, resolveMediaSrc, themeOrDefault } from "./media";
import { BrandBug, HashtagRow, remotionFontFamily } from "./primitives";
import { parseCompositionProps } from "./props";

export function WallOfText(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "wall_of_text");
  const wall = props.wallOfText;

  if (!wall) {
    throw new Error("Wall-of-text props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const broll = wall.broll[0];
  const headlineOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyLines = wall.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `linear-gradient(165deg, ${theme.background} 0%, #111827 42%, ${theme.secondary} 120%)`,
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.11) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 100%)",
          backgroundSize: "78px 78px",
          inset: 0,
          opacity: 0.32,
          position: "absolute",
        }}
      />
      <Audio
        loop
        src={resolveAudioSrc(props.music?.src)}
        volume={props.music?.volume ?? 0.08}
      />
      {broll ? (
        <Img
          src={resolveMediaSrc(broll)}
          style={{
            bottom: -90,
            filter: "saturate(0.9)",
            height: 860,
            left: 150,
            objectFit: "cover",
            opacity: 0.24,
            position: "absolute",
            transform: `translateY(${interpolate(
              frame,
              [0, durationInFrames],
              [60, -60],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )}px) rotate(-3deg)`,
            width: 900,
          }}
        />
      ) : null}

      <BrandBug props={props} />

      <div
        style={{
          left: 72,
          opacity: headlineOpacity,
          position: "absolute",
          right: 72,
          top: 220,
          transform: `translateY(${interpolate(frame, [0, 0.5 * fps], [36, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <div
          style={{
            color: theme.accent,
            fontSize: 30,
            fontWeight: 850,
            marginBottom: 22,
            textTransform: "uppercase",
          }}
        >
          {wall.sourceLabel ?? props.brand.name}
        </div>
        <div
          style={{
            fontSize: 86,
            fontWeight: 950,
            lineHeight: 0.92,
            maxWidth: 910,
          }}
        >
          {wall.headline}
        </div>
      </div>

      <div
        style={{
          background: "rgba(15,23,42,0.78)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 36,
          bottom: 180,
          left: 72,
          padding: "44px 42px",
          position: "absolute",
          right: 72,
        }}
      >
        {bodyLines.map((line, index) => {
          const start = 0.8 * fps + index * 11;
          const opacity = interpolate(frame, [start, start + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={`${line}-${index}`}
              style={{
                borderTop:
                  index === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                color: index === 0 ? theme.foreground : "rgba(248,250,252,0.88)",
                fontSize: index === 0 ? 52 : 42,
                fontWeight: index === 0 ? 900 : 750,
                lineHeight: 1.12,
                marginTop: index === 0 ? 0 : 24,
                opacity,
                paddingTop: index === 0 ? 0 : 24,
                transform: `translateY(${(1 - opacity) * 24}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      <HashtagRow hashtags={props.hashtags} theme={theme} />
    </AbsoluteFill>
  );
}
