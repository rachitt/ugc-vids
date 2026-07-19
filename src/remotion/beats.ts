import { manifest, type MusicAsset } from "../lib/assets/manifest";

export type BeatSnapDirection = "ceil" | "floor" | "nearest";

export type MusicBeatMetadata = {
  bpm: number;
  downbeatOffsetSec: number;
};

function assertPositiveNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}

export function beatFrames(bpm: number, fps: number): number {
  assertPositiveNumber(bpm, "bpm");
  assertPositiveNumber(fps, "fps");

  return (60 / bpm) * fps;
}

export function snapToBeat(
  frame: number,
  bpm: number,
  fps: number,
  downbeatOffsetSec = 0,
  direction: BeatSnapDirection = "nearest",
): number {
  const framesPerBeat = beatFrames(bpm, fps);
  const offsetFrame = downbeatOffsetSec * fps;
  const beatPosition = (frame - offsetFrame) / framesPerBeat;
  const snappedBeat =
    direction === "floor"
      ? Math.floor(beatPosition)
      : direction === "ceil"
        ? Math.ceil(beatPosition)
        : Math.round(beatPosition);

  return Math.round(offsetFrame + snappedBeat * framesPerBeat);
}

export function beatIndexAtFrame(
  frame: number,
  bpm: number,
  fps: number,
  downbeatOffsetSec = 0,
): number {
  const framesPerBeat = beatFrames(bpm, fps);
  const offsetFrame = downbeatOffsetSec * fps;

  return Math.floor((frame - offsetFrame) / framesPerBeat);
}

function normalizeMusicAssetId(assetId: string): string {
  return assetId.replace(/^asset:/, "").replace(/^\/+/, "");
}

function matchesMusicAsset(asset: MusicAsset, normalizedId: string): boolean {
  const withoutExtension = normalizedId.replace(/\.[a-z0-9]+$/i, "");

  return (
    asset.id === normalizedId ||
    asset.id === `music/${normalizedId}` ||
    asset.file === normalizedId ||
    asset.file === `assets/${normalizedId}` ||
    asset.file.replace(/\.[a-z0-9]+$/i, "") === withoutExtension ||
    asset.file.replace(/^assets\/music\//, "").replace(/\.[a-z0-9]+$/i, "") ===
      withoutExtension
  );
}

export function getMusicBeatMetadata(
  musicAssetId: string | null | undefined,
): MusicBeatMetadata | undefined {
  if (!musicAssetId) {
    return undefined;
  }

  const normalizedId = normalizeMusicAssetId(musicAssetId);
  const asset = manifest.music.find((candidate) =>
    matchesMusicAsset(candidate, normalizedId),
  );

  if (!asset) {
    return undefined;
  }

  return {
    bpm: asset.bpm,
    downbeatOffsetSec: asset.downbeatOffsetSec,
  };
}
