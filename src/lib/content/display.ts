import type { ContentScript } from "./types";
export { getContentFormatLabel, getContentInitials } from "./formats";

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
