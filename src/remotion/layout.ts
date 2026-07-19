import { createElement, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill } from "remotion";

export const TOP_SAFE = 220;
export const BOTTOM_SAFE = 340;
export const RIGHT_SAFE = 150;

export type SafeAreaProps = {
  children?: ReactNode;
  debug?: boolean;
  style?: CSSProperties;
};

export function SafeArea({ children, debug = false, style }: SafeAreaProps) {
  return createElement(
    AbsoluteFill,
    {
      style: {
        boxSizing: "border-box",
        paddingBottom: BOTTOM_SAFE,
        paddingRight: RIGHT_SAFE,
        paddingTop: TOP_SAFE,
        ...style,
      },
    },
    children,
    createElement(DebugSafeArea, { debug }),
  );
}

export function DebugSafeArea({ debug = false }: { debug?: boolean }) {
  if (!debug) {
    return null;
  }

  const zoneStyle: CSSProperties = {
    position: "absolute",
  };

  return createElement(
    AbsoluteFill,
    {
      style: {
        color: "#ffffff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 24,
        fontWeight: 800,
        pointerEvents: "none",
        zIndex: 500,
      },
    },
    createElement("div", {
      style: {
        ...zoneStyle,
        background: "rgba(244,63,94,0.24)",
        height: TOP_SAFE,
        left: 0,
        right: 0,
        top: 0,
      },
    }),
    createElement("div", {
      style: {
        ...zoneStyle,
        background: "rgba(59,130,246,0.22)",
        bottom: 0,
        height: BOTTOM_SAFE,
        left: 0,
        right: 0,
      },
    }),
    createElement("div", {
      style: {
        ...zoneStyle,
        background: "rgba(34,197,94,0.22)",
        bottom: 0,
        right: 0,
        top: 0,
        width: RIGHT_SAFE,
      },
    }),
    createElement("div", {
      style: {
        ...zoneStyle,
        border: "3px dashed rgba(255,255,255,0.42)",
        bottom: BOTTOM_SAFE,
        left: 0,
        right: RIGHT_SAFE,
        top: TOP_SAFE,
      },
    }),
  );
}
