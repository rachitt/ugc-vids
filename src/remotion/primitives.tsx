import { Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { RemotionProps, RemotionTheme } from "../lib/video/remotion-props";
import { resolveMediaSrc, themeOrDefault } from "./media";

export const remotionFontFamily =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

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
