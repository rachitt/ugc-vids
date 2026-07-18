type PlaceholderImageInput = {
  name: string;
  label?: string;
  seed?: string;
  width?: number;
  height?: number;
};

const palette = [
  { background: "#0f766e", accent: "#f59e0b", foreground: "#ecfeff" },
  { background: "#7c2d12", accent: "#22c55e", foreground: "#fff7ed" },
  { background: "#4338ca", accent: "#f97316", foreground: "#eef2ff" },
  { background: "#be123c", accent: "#06b6d4", foreground: "#fff1f2" },
  { background: "#365314", accent: "#a855f7", foreground: "#f7fee7" },
  { background: "#1d4ed8", accent: "#facc15", foreground: "#eff6ff" },
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initialsForName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "AI";
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createPortraitPlaceholderDataUri(input: PlaceholderImageInput) {
  const width = input.width ?? 512;
  const height = input.height ?? 640;
  const selected = palette[hashString(input.seed ?? input.name) % palette.length];
  const name = escapeSvgText(input.name);
  const label = escapeSvgText(input.label ?? "Library avatar");
  const initials = escapeSvgText(initialsForName(input.name));

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${selected.background}"/>
      <stop offset="100%" stop-color="${selected.accent}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width / 2}" cy="208" r="104" fill="${selected.foreground}" opacity="0.94"/>
  <path d="M128 486c18-92 72-142 128-142s110 50 128 142" fill="${selected.foreground}" opacity="0.94"/>
  <circle cx="220" cy="202" r="10" fill="${selected.background}"/>
  <circle cx="292" cy="202" r="10" fill="${selected.background}"/>
  <path d="M224 250c22 20 42 20 64 0" fill="none" stroke="${selected.background}" stroke-width="12" stroke-linecap="round"/>
  <rect x="78" y="522" width="356" height="72" rx="8" fill="#020617" opacity="0.72"/>
  <text x="${width / 2}" y="554" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="700" fill="#ffffff">${initials}</text>
  <text x="${width / 2}" y="580" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" fill="#dbeafe">${label}</text>
</svg>`);
}

export function createClipPlaceholderDataUri(input: PlaceholderImageInput) {
  const width = input.width ?? 640;
  const height = input.height ?? 360;
  const selected = palette[hashString(input.seed ?? input.name) % palette.length];
  const name = escapeSvgText(input.name);
  const label = escapeSvgText(input.label ?? "UGC clip");

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${selected.background}"/>
      <stop offset="100%" stop-color="${selected.accent}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="44" y="34" width="552" height="292" rx="8" fill="#020617" opacity="0.26"/>
  <path d="M286 132v96l84-48z" fill="${selected.foreground}"/>
  <text x="${width / 2}" y="282" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${name}</text>
  <text x="${width / 2}" y="312" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#e0f2fe">${label}</text>
</svg>`);
}
