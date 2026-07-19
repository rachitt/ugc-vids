import { spawnSync } from "node:child_process";
import { rm, stat } from "node:fs/promises";
import path from "node:path";

import {
  compositionIdForFormat,
  REMOTION_FPS,
  REMOTION_VIDEO_HEIGHT,
  REMOTION_VIDEO_WIDTH,
} from "../src/lib/video/remotion-props";
import { remotionFixtures } from "../src/remotion/fixtures";
import { renderVideoJob } from "../worker/render";
import type {
  RenderedVideoUpload,
  RenderedVideoUploadResult,
  RenderedVideoUploader,
} from "../worker/r2-upload";

type VideoProbe = {
  durationInSeconds?: number;
  fps?: number;
  height?: number;
  source: "ffprobe" | "none" | "remotion";
  warning?: string;
  width?: number;
};

type GoldenResult = {
  duration: string;
  expected: string;
  failures: string[];
  file: string;
  fixture: string;
  fps: string;
  height: string;
  probe: string;
  sizeKB: string;
  status: "fail" | "pass";
  warnings: string[];
  width: string;
};

const projectRoot = process.cwd();
const goldenDir = path.join(projectRoot, ".renders", "golden");
const minBytes = 200 * 1024;
const durationToleranceSeconds = 0.2;

class GoldenUploader implements RenderedVideoUploader {
  async uploadRenderedVideo(
    upload: RenderedVideoUpload,
  ): Promise<RenderedVideoUploadResult> {
    return {
      key: upload.key,
      url: upload.localPath,
    };
  }
}

async function main() {
  await rm(goldenDir, { force: true, recursive: true });

  const uploader = new GoldenUploader();
  const results: GoldenResult[] = [];

  for (const fixture of remotionFixtures) {
    const render = await renderVideoJob(
      {
        compositionId: compositionIdForFormat(fixture.format),
        contentItemId: `golden-${fixture.id}`,
        outputDir: goldenDir,
        props: fixture.props,
        workspaceId: "golden",
      },
      uploader,
    );
    const stats = await stat(render.localPath);
    const probe = await probeVideo(render.localPath);
    const expectedDuration = fixture.props.durationInFrames / REMOTION_FPS;
    const failures: string[] = [];
    const warnings: string[] = [];

    if (stats.size <= minBytes) {
      failures.push(`size <= ${minBytes} bytes`);
    }

    if (probe.warning) {
      warnings.push(probe.warning);
    }

    if (probe.source !== "none") {
      if (probe.width !== REMOTION_VIDEO_WIDTH) {
        failures.push(`width ${probe.width ?? "unknown"}`);
      }

      if (probe.height !== REMOTION_VIDEO_HEIGHT) {
        failures.push(`height ${probe.height ?? "unknown"}`);
      }

      if (probe.fps !== REMOTION_FPS) {
        failures.push(`fps ${probe.fps ?? "unknown"}`);
      }

      if (
        typeof probe.durationInSeconds !== "number" ||
        Math.abs(probe.durationInSeconds - expectedDuration) >
          durationToleranceSeconds
      ) {
        failures.push(
          `duration ${formatNumber(probe.durationInSeconds)}s expected ${formatNumber(
            expectedDuration,
          )}s`,
        );
      }
    }

    results.push({
      fixture: fixture.id,
      file: path.relative(projectRoot, render.localPath),
      sizeKB: Math.round(stats.size / 1024).toString(),
      width: formatNumber(probe.width),
      height: formatNumber(probe.height),
      fps: formatNumber(probe.fps),
      duration: formatNumber(probe.durationInSeconds),
      expected: formatNumber(expectedDuration),
      probe: probe.source,
      warnings,
      failures,
      status: failures.length === 0 ? "pass" : "fail",
    });
  }

  console.table(
    results.map((result) => ({
      fixture: result.fixture,
      status: result.status,
      sizeKB: result.sizeKB,
      width: result.width,
      height: result.height,
      fps: result.fps,
      duration: result.duration,
      expected: result.expected,
      probe: result.probe,
      notes: [...result.failures, ...result.warnings].join("; "),
      file: result.file,
    })),
  );

  const failures = results.filter((result) => result.failures.length > 0);

  if (failures.length > 0) {
    throw new Error(
      `Golden render assertions failed for ${failures
        .map((result) => result.fixture)
        .join(", ")}.`,
    );
  }
}

async function probeVideo(filePath: string): Promise<VideoProbe> {
  const remotionProbe = await probeVideoWithRemotion(filePath);

  if (remotionProbe) {
    return remotionProbe;
  }

  const ffprobe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,r_frame_rate:format=duration",
      "-of",
      "json",
      filePath,
    ],
    { encoding: "utf8" },
  );

  if (ffprobe.error || ffprobe.status !== 0) {
    return {
      source: "none",
      warning:
        "getVideoMetadata unavailable and ffprobe not found; metadata assertions skipped",
    };
  }

  const parsed = JSON.parse(ffprobe.stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      height?: number;
      r_frame_rate?: string;
      width?: number;
    }>;
  };
  const stream = parsed.streams?.[0];

  return {
    source: "ffprobe",
    width: stream?.width,
    height: stream?.height,
    fps: parseRate(stream?.r_frame_rate),
    durationInSeconds:
      typeof parsed.format?.duration === "string"
        ? Number(parsed.format.duration)
        : undefined,
  };
}

async function probeVideoWithRemotion(
  filePath: string,
): Promise<VideoProbe | null> {
  try {
    const renderer = (await import("@remotion/renderer")) as {
      getVideoMetadata?: (
        source: string,
        options?: {
          logLevel?: "error" | "info" | "trace" | "verbose" | "warn";
        },
      ) => Promise<{
        durationInSeconds: number | null;
        fps: number;
        height: number;
        width: number;
      }>;
    };

    if (typeof renderer.getVideoMetadata !== "function") {
      return null;
    }

    const metadata = await renderer.getVideoMetadata(filePath, {
      logLevel: "warn",
    });

    return {
      source: "remotion",
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      durationInSeconds: metadata.durationInSeconds ?? undefined,
    };
  } catch {
    return null;
  }
}

function parseRate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const [rawNumerator, rawDenominator] = value.split("/");
  const numerator = Number(rawNumerator);
  const denominator = Number(rawDenominator ?? "1");

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return undefined;
  }

  return denominator === 0 ? undefined : numerator / denominator;
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2).replace(/\.00$/, "")
    : "skip";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
