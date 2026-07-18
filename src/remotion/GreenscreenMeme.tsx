import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { resolveMediaSrc, themeOrDefault } from "./media";
import { BrandBug, remotionFontFamily } from "./primitives";
import { parseCompositionProps } from "./props";

export function GreenscreenMeme(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "greenscreen_meme");
  const meme = props.greenscreenMeme;

  if (!meme) {
    throw new Error("Greenscreen meme props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cutoutEntrance = spring({
    config: {
      damping: 18,
      stiffness: 130,
    },
    fps,
    frame: frame - 12,
  });
  const captionPop = spring({
    config: {
      damping: 16,
      stiffness: 190,
    },
    fps,
    frame: frame - 28,
  });
  const backgroundScale = interpolate(frame, [0, 300], [1.06, 1.01], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
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
            "linear-gradient(180deg, rgba(0,0,0,0.48) 0%, transparent 26%, transparent 62%, rgba(0,0,0,0.72) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />

      <BrandBug props={props} />

      <div
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "6px solid #111827",
          borderRadius: 30,
          left: 72,
          padding: "28px 34px",
          position: "absolute",
          right: 72,
          top: 190,
        }}
      >
        <div
          style={{
            color: "#111827",
            fontSize: 58,
            fontWeight: 950,
            lineHeight: 0.98,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {props.title}
        </div>
      </div>

      {meme.reactionLabel ? (
        <div
          style={{
            background: theme.accent,
            borderRadius: 999,
            color: theme.background,
            fontSize: 32,
            fontWeight: 900,
            left: 90,
            padding: "14px 26px",
            position: "absolute",
            top: 470,
            transform: "rotate(-3deg)",
          }}
        >
          {meme.reactionLabel}
        </div>
      ) : null}

      <div
        style={{
          bottom: 315,
          height: 920,
          left: 120,
          position: "absolute",
          transform: `translateY(${(1 - cutoutEntrance) * 120}px) scale(${
            0.9 + cutoutEntrance * 0.1
          })`,
          width: 840,
        }}
      >
        <Img
          src={resolveMediaSrc(meme.persona)}
          style={{
            filter: "drop-shadow(0 40px 54px rgba(0,0,0,0.45))",
            height: "100%",
            objectFit: "contain",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          background: meme.captionBar ?? "#111827",
          borderTop: `8px solid ${theme.accent}`,
          bottom: 0,
          left: 0,
          minHeight: 290,
          padding: "44px 72px 64px",
          position: "absolute",
          right: 0,
          transform: `translateY(${(1 - captionPop) * 120}px)`,
        }}
      >
        <div
          style={{
            color: theme.foreground,
            fontSize: 62,
            fontWeight: 950,
            lineHeight: 0.96,
            textAlign: "center",
          }}
        >
          {meme.caption}
        </div>
        {props.caption ? (
          <div
            style={{
              color: "rgba(248,250,252,0.76)",
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.12,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {props.caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
