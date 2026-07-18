import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type PlaceholderVideoProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderVideo({ subtitle, title }: PlaceholderVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "linear-gradient(160deg, #08111f 0%, #0e2727 48%, #f5f0e8 49%, #f5f0e8 100%)",
        color: "#ffffff",
        display: "flex",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        justifyContent: "center",
        padding: 96,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${(1 - entrance) * 80}px)`,
          width: "100%",
        }}
      >
        <p
          style={{
            color: "#4ade80",
            fontSize: 48,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
        <h1
          style={{
            fontSize: 128,
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 0.95,
            margin: "24px 0 0",
          }}
        >
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
}
