import type { ContentFormat, ContentScript } from "./types";

const formatLabels: Record<ContentFormat, string> = {
  avatar_ugc: "Avatar UGC",
  greenscreen_meme: "Green Screen",
  hook_demo: "Hook + Demo",
  slideshow: "Slideshow",
  wall_of_text: "Wall of Text",
};

export function getContentFormatLabel(format: ContentFormat) {
  return formatLabels[format];
}

export function getScriptHook(script: ContentScript) {
  return script.hook?.trim() || "Untitled hook";
}

export function getScriptPreview(script: ContentScript) {
  const lines =
    script.slides && script.slides.length > 0 ? script.slides : script.lines;

  if (lines && lines.length > 0) {
    return lines.join(" ");
  }

  return script.caption?.trim() || "No script preview available yet.";
}

export function getScriptBeats(script: ContentScript) {
  if (script.slides && script.slides.length > 0) {
    return script.slides;
  }

  return script.lines ?? [];
}

export function getContentInitials(format: ContentFormat) {
  return getContentFormatLabel(format)
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
