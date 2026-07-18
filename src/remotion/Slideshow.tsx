import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { resolveAudioSrc, themeOrDefault } from "./media";
import {
  BackgroundWash,
  BrandBug,
  HashtagRow,
  PlaceholderImage,
  remotionFontFamily,
} from "./primitives";
import { parseCompositionProps } from "./props";

export function Slideshow(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "slideshow");
  const slideshow = props.slideshow;

  if (!slideshow) {
    throw new Error("Slideshow props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const slideDuration = Math.max(
    1,
    Math.floor(durationInFrames / slideshow.slides.length),
  );
  const activeIndex = Math.min(
    slideshow.slides.length - 1,
    Math.floor(frame / slideDuration),
  );
  const activeSlide = slideshow.slides[activeIndex];
  const localFrame = frame - activeIndex * slideDuration;
  const progress = localFrame / slideDuration;
  const scale = interpolate(localFrame, [0, slideDuration], [1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardEntrance = spring({
    config: {
      damping: 21,
      stiffness: 150,
    },
    fps,
    frame: localFrame,
  });
  const captionOpacity = interpolate(localFrame, [4, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        color: theme.foreground,
        fontFamily: remotionFontFamily,
        overflow: "hidden",
      }}
    >
      <BackgroundWash theme={theme} />
      <Audio
        loop
        src={resolveAudioSrc(props.music?.src)}
        volume={props.music?.volume ?? 0.08}
      />

      <BrandBug props={props} />

      <div
        style={{
          left: 72,
          position: "absolute",
          right: 72,
          top: 210,
        }}
      >
        {slideshow.kicker ? (
          <div
            style={{
              color: theme.accent,
              fontSize: 34,
              fontWeight: 850,
              letterSpacing: 0,
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            {slideshow.kicker}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            lineHeight: 0.95,
            maxWidth: 860,
          }}
        >
          {props.title}
        </div>
      </div>

      <div
        style={{
          bottom: 330,
          height: 980,
          left: 72,
          position: "absolute",
          right: 72,
          transform: `translateY(${(1 - cardEntrance) * 70}px) scale(${scale})`,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 48,
            boxShadow: "0 36px 120px rgba(0,0,0,0.35)",
            height: "100%",
            overflow: "hidden",
            padding: 28,
          }}
        >
          <PlaceholderImage asset={activeSlide.image} borderRadius={34} />
        </div>
      </div>

      <div
        style={{
          background: "rgba(15,23,42,0.86)",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: 34,
          bottom: 174,
          boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
          left: 72,
          opacity: captionOpacity,
          padding: "28px 34px",
          position: "absolute",
          right: 72,
        }}
      >
        {activeSlide.eyebrow ? (
          <div
            style={{
              color: theme.accent,
              fontSize: 26,
              fontWeight: 850,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            {activeSlide.eyebrow}
          </div>
        ) : null}
        <div
          style={{
            color: theme.foreground,
            fontSize: 46,
            fontWeight: 850,
            lineHeight: 1.04,
          }}
        >
          {activeSlide.caption}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.22)",
          borderRadius: 999,
          bottom: 130,
          height: 10,
          left: 72,
          overflow: "hidden",
          position: "absolute",
          right: 72,
        }}
      >
        <div
          style={{
            background: theme.accent,
            borderRadius: 999,
            height: "100%",
            width: `${Math.max(4, Math.min(100, progress * 100))}%`,
          }}
        />
      </div>

      <HashtagRow hashtags={props.hashtags} theme={theme} />
    </AbsoluteFill>
  );
}
