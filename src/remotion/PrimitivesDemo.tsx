import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

import { WordCaptions } from "./captions";
import { useRemotionFonts } from "./fonts";
import { SafeArea } from "./layout";
import {
  GrainOverlay,
  MemeText,
  PhoneFrame,
  StickerChip,
  remotionFontFamily,
} from "./primitives";

export type PrimitivesDemoProps = {
  captionText: string;
  chipEmoji?: string;
  chipText: string;
  debugSafeArea?: boolean;
  durationInFrames: number;
  headline: string;
};

export function PrimitivesDemo({
  captionText,
  chipEmoji,
  chipText,
  debugSafeArea = false,
  headline,
}: PrimitivesDemoProps) {
  useRemotionFonts();

  const frame = useCurrentFrame();
  const phoneFloat = interpolate(frame, [0, 180], [18, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: "#07111f",
        color: "#f8fafc",
        fontFamily: remotionFontFamily,
        height: "100%",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <Img
        src={staticFile("assets/gradients/gradient-03.webp")}
        style={{
          filter: "saturate(1.18) contrast(1.08)",
          height: "100%",
          objectFit: "cover",
          opacity: 0.76,
          width: "100%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(3,7,18,0.32) 0%, rgba(3,7,18,0.62) 58%, rgba(3,7,18,0.9) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />

      <SafeArea debug={debugSafeArea} style={{ paddingLeft: 72 }}>
        <div style={{ height: "100%", position: "relative", width: "100%" }}>
          <div
            style={{
              left: 0,
              position: "absolute",
              right: 18,
              top: 20,
            }}
          >
            <MemeText fontSize={92} maxWidth={790} text={headline} />
          </div>

          <div style={{ left: 18, position: "absolute", top: 320 }}>
            <StickerChip
              background="#2dd4bf"
              emoji={chipEmoji}
              rotationDeg={-4}
              startFrame={14}
            >
              {chipText}
            </StickerChip>
          </div>

          <PhoneFrame
            height={950}
            screenStyle={{ background: "#0f172a" }}
            style={{
              left: 178,
              position: "absolute",
              top: 355,
              transform: `translateY(${phoneFloat}px) rotate(2deg)`,
            }}
            width={468}
          >
            <Img
              src={staticFile("assets/broll/broll-01.webp")}
              style={{
                filter: "saturate(0.95) contrast(1.04)",
                height: "100%",
                objectFit: "cover",
                opacity: 0.88,
                width: "100%",
              }}
            />
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(15,23,42,0.24), rgba(15,23,42,0.82))",
                inset: 0,
                position: "absolute",
              }}
            />
            <div
              style={{
                left: 34,
                position: "absolute",
                right: 34,
                top: 82,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: 999,
                  height: 16,
                  marginBottom: 20,
                  width: 150,
                }}
              />
              <div
                style={{
                  background: "rgba(255,255,255,0.72)",
                  borderRadius: 999,
                  height: 12,
                  marginBottom: 10,
                  width: 310,
                }}
              />
              <div
                style={{
                  background: "rgba(255,255,255,0.48)",
                  borderRadius: 999,
                  height: 12,
                  width: 240,
                }}
              />
            </div>
            <div
              style={{
                background: "rgba(248,250,252,0.94)",
                borderRadius: 26,
                bottom: 42,
                color: "#111827",
                fontSize: 25,
                fontWeight: 900,
                left: 30,
                lineHeight: 1.08,
                padding: "22px 24px",
                position: "absolute",
                right: 30,
                textTransform: "uppercase",
              }}
            >
              Word timings, safe zones, chips, frames, and grain in one pass.
            </div>
          </PhoneFrame>

          <WordCaptions
            fontSize={58}
            highlightColor="#facc15"
            startFrame={44}
            style={{
              bottom: 34,
              justifyContent: "center",
              left: 0,
              right: 0,
              top: 1060,
            }}
            text={captionText}
            wordsPerSecond={5.2}
          />
        </div>
      </SafeArea>

      <GrainOverlay />
    </div>
  );
}
