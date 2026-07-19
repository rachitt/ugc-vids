import rawManifest from "../../../public/assets/manifest.json";

export type MusicAsset = {
  id: string;
  file: string;
  bpm: number;
  downbeatOffsetSec: number;
  mood: "chill" | "epic" | "tense" | "upbeat";
  durationSec: number;
};

export type MemeBackgroundAsset = {
  id: string;
  file: string;
  tags: string[];
};

export type GradientAsset = {
  id: string;
  file: string;
  tone: "dark" | "light" | "vivid";
};

export type BrollAsset = {
  id: string;
  file: string;
  kind: "image" | "video";
  tags: string[];
  durationSec?: number;
};

export type PersonaAsset = {
  id: string;
  file: string;
  vibe: string[];
};

export type AssetManifest = {
  music: MusicAsset[];
  memeBackgrounds: MemeBackgroundAsset[];
  gradients: GradientAsset[];
  broll: BrollAsset[];
  personas: PersonaAsset[];
};

export type ManifestAsset =
  | MusicAsset
  | MemeBackgroundAsset
  | GradientAsset
  | BrollAsset
  | PersonaAsset;

export const manifest = rawManifest as AssetManifest;

const assetById = new Map<string, ManifestAsset>(
  [
    ...manifest.music,
    ...manifest.memeBackgrounds,
    ...manifest.gradients,
    ...manifest.broll,
    ...manifest.personas,
  ].map((asset) => [asset.id, asset]),
);

export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < str.length; index += 1) {
    hash = Math.imul(hash ^ str.charCodeAt(index), 0x01000193);
  }

  return hash >>> 0;
}

export function pickAsset<T>(pool: readonly T[], seed: string): T | undefined {
  if (pool.length === 0) {
    return undefined;
  }

  return pool[fnv1a(seed) % pool.length];
}

export function getAssetById(id: string): ManifestAsset | undefined {
  return assetById.get(id);
}
