import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps } from "../lib/video/remotion-props";
import { themeOrDefault } from "./media";
import {
  BackgroundWash,
  BrandBug,
  PlaceholderImage,
  remotionFontFamily,
} from "./primitives";
import { parseCompositionProps } from "./props";

const HOOK_FRAMES = 84;

export function HookDemo(inputProps: RemotionProps) {
  const props = parseCompositionProps(inputProps, "hook_demo");
  const hookDemo = props.hookDemo;

  if (!hookDemo) {
    throw new Error("Hook-demo props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const shotFrames = Math.max(1, durationInFrames - HOOK_FRAMES);
  const perShot = Math.max(1, Math.floor(shotFrames / hookDemo.shots.length));
  const shotFrame = Math.max(0, frame - HOOK_FRAMES);
  const shotIndex = Math.min(
    hookDemo.shots.length - 1,
    Math.floor(shotFrame / perShot),
  );
  const shot = hookDemo.shots[shotIndex];
  const hookOpacity = interpolate(frame, [HOOK_FRAMES - 16, HOOK_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const demoOpacity = interpolate(frame, [HOOK_FRAMES - 8, HOOK_FRAMES + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shotLocal = shotFrame - shotIndex * perShot;
  const shotEntrance = spring({
    config: {
      damping: 19,
      stiffness: 160,
    },
    fps,
    frame: shotLocal,
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
      <BrandBug props={props} />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          inset: 0,
          justifyContent: "center",
          opacity: hookOpacity,
          padding: 72,
          position: "absolute",
        }}
      >
        <div
          style={{
            background: "rgba(248,250,252,0.96)",
            borderRadius: 42,
            color: "#111827",
            padding: "74px 62px",
            transform: `translateY(${interpolate(frame, [0, 24], [42, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
            width: "100%",
          }}
        >
          <div
            style={{
              color: theme.accent,
              fontSize: 34,
              fontWeight: 900,
              marginBottom: 28,
              textTransform: "uppercase",
            }}
          >
            Watch this
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 950,
              lineHeight: 0.92,
            }}
          >
            {hookDemo.hook}
          </div>
          {hookDemo.subhook ? (
            <div
              style={{
                color: "#334155",
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.1,
                marginTop: 34,
              }}
            >
              {hookDemo.subhook}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          bottom: 116,
          left: 72,
          opacity: demoOpacity,
          position: "absolute",
          right: 72,
          top: 210,
        }}
      >
        <div
          style={{
            color: theme.accent,
            fontSize: 30,
            fontWeight: 900,
            marginBottom: 22,
            textTransform: "uppercase",
          }}
        >
          {shot.label ?? props.title}
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 950,
            lineHeight: 0.95,
            marginBottom: 34,
            maxWidth: 850,
          }}
        >
          {shot.caption ?? props.title}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.13)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 42,
            boxShadow: "0 40px 120px rgba(0,0,0,0.38)",
            height: 1020,
            overflow: "hidden",
            padding: 28,
            transform: `translateY(${(1 - shotEntrance) * 70}px)`,
          }}
        >
          <PlaceholderImage asset={shot.image} borderRadius={34} />
        </div>

        {hookDemo.cta ? (
          <div
            style={{
              alignItems: "center",
              background: theme.accent,
              borderRadius: 28,
              color: theme.background,
              display: "flex",
              fontSize: 36,
              fontWeight: 950,
              justifyContent: "center",
              marginTop: 32,
              minHeight: 86,
              padding: "0 30px",
              textAlign: "center",
            }}
          >
            {hookDemo.cta}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}
