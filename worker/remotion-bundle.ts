import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { bundle } from "@remotion/bundler";

type EnsureRemotionBundleOptions = {
  projectRoot: string;
  rendersDir: string;
};

type FingerprintEntry = {
  filePath: string;
  mtimeMs: number;
  size: number;
};

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function collectFingerprintEntries(
  rootPath: string,
): Promise<FingerprintEntry[]> {
  const stats = await stat(rootPath);

  if (stats.isFile()) {
    return [
      {
        filePath: rootPath,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      },
    ];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const entries = await readdir(rootPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      collectFingerprintEntries(path.join(rootPath, entry.name)),
    ),
  );

  return nested.flat();
}

async function remotionSourceFingerprint(projectRoot: string): Promise<string> {
  const fingerprintRoots = [
    "src/remotion",
    "src/lib/assets",
    "src/lib/video",
    "public/assets/manifest.json",
  ];
  const entries = (
    await Promise.all(
      fingerprintRoots.map((relativePath) =>
        collectFingerprintEntries(path.join(projectRoot, relativePath)),
      ),
    )
  )
    .flat()
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
  const maxMtimeMs = entries.reduce(
    (max, entry) => Math.max(max, entry.mtimeMs),
    0,
  );

  return JSON.stringify({
    count: entries.length,
    maxMtimeMs,
    totalSize: entries.reduce((total, entry) => total + entry.size, 0),
  });
}

export async function ensureRemotionBundle({
  projectRoot,
  rendersDir,
}: EnsureRemotionBundleOptions): Promise<string> {
  const bundleDir = path.join(rendersDir, "remotion-bundle");
  const fingerprintFile = path.join(rendersDir, "remotion-bundle.fingerprint");
  const indexFile = path.join(bundleDir, "index.html");
  const fingerprint = await remotionSourceFingerprint(projectRoot);

  if (
    (await pathExists(indexFile)) &&
    (await readTextFile(fingerprintFile)) === fingerprint
  ) {
    return bundleDir;
  }

  await rm(bundleDir, { force: true, recursive: true });

  const bundledDir = await bundle({
    entryPoint: path.join(projectRoot, "worker/remotion-entry.ts"),
    outDir: bundleDir,
  });

  await writeFile(fingerprintFile, fingerprint);

  return bundledDir;
}
