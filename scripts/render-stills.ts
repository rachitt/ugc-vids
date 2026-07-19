import { mkdir } from "node:fs/promises";
import path from "node:path";

import { renderStill, selectComposition } from "@remotion/renderer";

import { remotionStillFixtures } from "../src/remotion/fixtures";
import { ensureRemotionBundle } from "../worker/remotion-bundle";

const stillPercentages = [0, 20, 45, 70, 95] as const;
const projectRoot = process.cwd();
const rendersDir = path.join(projectRoot, ".renders");
const reviewDir = path.join(rendersDir, "review");

function frameForPercentage(
  durationInFrames: number,
  percentage: (typeof stillPercentages)[number],
): number {
  const lastFrame = Math.max(0, durationInFrames - 1);

  return Math.min(lastFrame, Math.round(lastFrame * (percentage / 100)));
}

async function main() {
  await mkdir(reviewDir, { recursive: true });

  const serveUrl = await ensureRemotionBundle({
    projectRoot,
    rendersDir,
  });

  for (const fixture of remotionStillFixtures) {
    const composition = await selectComposition({
      id: fixture.compositionId,
      inputProps: fixture.props,
      logLevel: "warn",
      serveUrl,
    });

    for (const percentage of stillPercentages) {
      const frame = frameForPercentage(
        composition.durationInFrames,
        percentage,
      );
      const output = path.join(reviewDir, `${fixture.id}-${percentage}.png`);

      await renderStill({
        composition,
        frame,
        imageFormat: "png",
        inputProps: fixture.props,
        logLevel: "warn",
        output,
        overwrite: true,
        serveUrl,
      });

      console.log("STILL", fixture.id, `${percentage}%`, output);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
