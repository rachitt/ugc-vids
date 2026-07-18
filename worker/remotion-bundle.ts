import { stat } from "node:fs/promises";
import path from "node:path";

import { bundle } from "@remotion/bundler";

type EnsureRemotionBundleOptions = {
  projectRoot: string;
  rendersDir: string;
};

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureRemotionBundle({
  projectRoot,
  rendersDir,
}: EnsureRemotionBundleOptions): Promise<string> {
  const bundleDir = path.join(rendersDir, "remotion-bundle");
  const indexFile = path.join(bundleDir, "index.html");

  if (await pathExists(indexFile)) {
    return bundleDir;
  }

  return bundle({
    entryPoint: path.join(projectRoot, "worker/remotion-entry.ts"),
    outDir: bundleDir,
  });
}
