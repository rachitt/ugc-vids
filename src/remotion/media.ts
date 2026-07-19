import type { MediaAsset, RemotionTheme } from "../lib/video/remotion-props";
import { staticFile } from "remotion";

import { getAssetById } from "../lib/assets/manifest";

export const SILENT_AUDIO_SRC =
  "data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

const placeholderLabels: Record<string, string> = {
  analytics: "Analytics dashboard",
  checkout: "Checkout flow",
  community: "Community proof",
  dashboard: "Product dashboard",
  demo: "Live product demo",
  graph: "Growth chart",
  meme: "Meme background",
  persona: "Creator cutout",
  product: "Product shot",
  social: "Social proof",
  workflow: "Workflow board",
};

const placeholderPalettes: Record<string, [string, string, string]> = {
  analytics: ["#0f172a", "#14b8a6", "#f8fafc"],
  checkout: ["#172554", "#f97316", "#f8fafc"],
  community: ["#111827", "#f43f5e", "#f8fafc"],
  dashboard: ["#052e2b", "#84cc16", "#f8fafc"],
  demo: ["#1f2937", "#38bdf8", "#f8fafc"],
  graph: ["#18181b", "#eab308", "#f8fafc"],
  meme: ["#f8fafc", "#0ea5e9", "#111827"],
  persona: ["#ecfeff", "#22c55e", "#0f172a"],
  product: ["#111827", "#a3e635", "#f8fafc"],
  social: ["#312e81", "#facc15", "#f8fafc"],
  workflow: ["#0f172a", "#fb7185", "#f8fafc"],
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function placeholderSvg(kind: string, label: string): string {
  const [background, accent, foreground] =
    placeholderPalettes[kind] ?? placeholderPalettes.product;
  const escapedLabel = escapeXml(label);

  if (kind === "persona") {
    return svgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300" viewBox="0 0 900 1300">
        <rect width="900" height="1300" fill="none"/>
        <ellipse cx="450" cy="370" rx="180" ry="190" fill="${accent}"/>
        <circle cx="390" cy="335" r="18" fill="${foreground}"/>
        <circle cx="510" cy="335" r="18" fill="${foreground}"/>
        <path d="M365 425 Q450 500 535 425" fill="none" stroke="${foreground}" stroke-width="28" stroke-linecap="round"/>
        <path d="M205 1230 Q450 690 695 1230 Z" fill="${background}"/>
        <path d="M280 760 Q450 655 620 760 L700 1230 H200 Z" fill="${accent}" opacity="0.88"/>
        <text x="450" y="1180" fill="${foreground}" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800">${escapedLabel}</text>
      </svg>
    `);
  }

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${background}" offset="0"/>
          <stop stop-color="${accent}" offset="1"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1440" rx="52" fill="url(#g)"/>
      <circle cx="880" cy="220" r="210" fill="${foreground}" opacity="0.12"/>
      <circle cx="190" cy="1110" r="260" fill="${foreground}" opacity="0.1"/>
      <rect x="120" y="270" width="840" height="500" rx="44" fill="${foreground}" opacity="0.13"/>
      <rect x="178" y="342" width="330" height="42" rx="21" fill="${foreground}" opacity="0.8"/>
      <rect x="178" y="430" width="724" height="34" rx="17" fill="${foreground}" opacity="0.45"/>
      <rect x="178" y="504" width="620" height="34" rx="17" fill="${foreground}" opacity="0.35"/>
      <path d="M190 675 C330 550 450 730 610 590 C710 505 790 535 900 420" fill="none" stroke="${foreground}" stroke-width="26" stroke-linecap="round" opacity="0.75"/>
      <text x="540" y="960" fill="${foreground}" text-anchor="middle" font-family="Arial, sans-serif" font-size="78" font-weight="800">${escapedLabel}</text>
    </svg>
  `);
}

export function resolveMediaSrc(asset: MediaAsset | undefined): string {
  const src = asset?.src;

  if (!src) {
    return placeholderSvg("product", "Product shot");
  }

  if (src.startsWith("asset:")) {
    const manifestAsset = getAssetById(src.replace("asset:", ""));

    if (manifestAsset) {
      return staticFile(manifestAsset.file);
    }

    return placeholderSvg("product", asset?.label ?? "Product shot");
  }

  if (src.startsWith("placeholder:")) {
    const kind = src.replace("placeholder:", "");
    const label = asset?.label ?? placeholderLabels[kind] ?? "Placeholder";

    return placeholderSvg(kind, label);
  }

  return src;
}

export function resolveAudioSrc(src: string | undefined): string {
  if (!src || src === "silent:placeholder") {
    return SILENT_AUDIO_SRC;
  }

  if (src.startsWith("asset:")) {
    const asset = getAssetById(src.replace("asset:", ""));

    return asset ? staticFile(asset.file) : SILENT_AUDIO_SRC;
  }

  return src;
}

export function themeOrDefault(theme: RemotionTheme | undefined): RemotionTheme {
  return {
    accent: theme?.accent ?? "#22c55e",
    background: theme?.background ?? "#0f172a",
    foreground: theme?.foreground ?? "#f8fafc",
    muted: theme?.muted ?? "#94a3b8",
    secondary: theme?.secondary ?? "#38bdf8",
  };
}
