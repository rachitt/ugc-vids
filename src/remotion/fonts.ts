import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const INTER_FONT_FAMILY = "Inter";
export const ANTON_FONT_FAMILY = "Anton";
export const ARCHIVO_BLACK_FONT_FAMILY = "Archivo Black";

export const REMOTION_FONT_STACK = `${INTER_FONT_FAMILY}, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

const fontDefinitions = [
  {
    family: INTER_FONT_FAMILY,
    format: "woff2",
    url: staticFile("assets/fonts/Inter-Regular.woff2"),
    weight: "400",
  },
  {
    family: INTER_FONT_FAMILY,
    format: "woff2",
    url: staticFile("assets/fonts/Inter-Bold.woff2"),
    weight: "700",
  },
  {
    family: INTER_FONT_FAMILY,
    format: "woff2",
    url: staticFile("assets/fonts/Inter-Black.woff2"),
    weight: "900",
  },
  {
    family: ANTON_FONT_FAMILY,
    format: "truetype",
    url: staticFile("assets/fonts/Anton-Regular.ttf"),
    weight: "400",
  },
  {
    family: ARCHIVO_BLACK_FONT_FAMILY,
    format: "truetype",
    url: staticFile("assets/fonts/ArchivoBlack-Regular.ttf"),
    weight: "400",
  },
] as const;

let fontLoadPromise: Promise<void> | undefined;

export function loadRemotionFonts(): Promise<void> {
  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    return Promise.resolve();
  }

  fontLoadPromise ??= Promise.all(
    fontDefinitions.map((definition) =>
      loadFont({
        display: "block",
        family: definition.family,
        format: definition.format,
        url: definition.url,
        weight: definition.weight,
      }),
    ),
  ).then(() => undefined);

  return fontLoadPromise;
}

export function useRemotionFonts(): void {
  const [handle] = useState(() => delayRender("Loading Remotion fonts"));

  useEffect(() => {
    loadRemotionFonts()
      .then(() => continueRender(handle))
      .catch((error: unknown) => cancelRender(error));
  }, [handle]);
}
