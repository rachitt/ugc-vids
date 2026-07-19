import { mkdir } from "node:fs/promises";
import path from "node:path";

import { renderMedia, selectComposition } from "@remotion/renderer";

import { normalizeRenderJobData } from "../src/lib/video/render-jobs";
import type { NormalizedRenderJob } from "../src/lib/video/render-jobs";
import type { RenderJobData } from "../src/lib/jobs/queues";
import { ensureRemotionBundle } from "./remotion-bundle";
import type { RenderedVideoUploader } from "./r2-upload";

export type RenderVideoResult = {
  contentItemId: string;
  key: string;
  localPath: string;
  renderStatus: "rendered";
  videoUrl: string;
};

type RenderVideoJobData = RenderJobData & {
  outputDir?: string;
  serveUrl?: string;
};

const projectRoot = process.cwd();
const rendersDir = path.join(projectRoot, ".renders");

function safePathSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function resolveServeUrl(job: NormalizedRenderJob): Promise<string> {
  if (job.serveUrl) {
    return job.serveUrl;
  }

  if (process.env.REMOTION_SERVE_URL) {
    return process.env.REMOTION_SERVE_URL;
  }

  return ensureRemotionBundle({
    projectRoot,
    rendersDir,
  });
}

export async function renderVideoJob(
  rawJobData: RenderVideoJobData,
  uploader: RenderedVideoUploader,
): Promise<RenderVideoResult> {
  const job = normalizeRenderJobData(rawJobData);
  const serveUrl = await resolveServeUrl(job);
  const outputDir =
    typeof rawJobData.outputDir === "string" && rawJobData.outputDir.length > 0
      ? path.resolve(projectRoot, rawJobData.outputDir)
      : rendersDir;

  await mkdir(outputDir, { recursive: true });

  const outputName = `${safePathSegment(job.contentItemId)}-${job.compositionId}-${Date.now()}.mp4`;
  const outputLocation = path.join(outputDir, outputName);
  const composition = await selectComposition({
    id: job.compositionId,
    inputProps: job.props,
    logLevel: "warn",
    serveUrl,
  });

  await renderMedia({
    codec: "h264",
    composition,
    concurrency: 1,
    inputProps: job.props,
    logLevel: "warn",
    outputLocation,
    overwrite: true,
    serveUrl,
  });

  const workspacePath = safePathSegment(job.workspaceId) || "unknown";
  const contentItemPath = safePathSegment(job.contentItemId) || "unknown";
  const key = `renders/${workspacePath}/${contentItemPath}/${Date.now()}.mp4`;
  const upload = await uploader.uploadRenderedVideo({
    contentType: "video/mp4",
    key,
    localPath: outputLocation,
  });

  return {
    contentItemId: job.contentItemId,
    key: upload.key,
    localPath: outputLocation,
    renderStatus: "rendered",
    videoUrl: upload.url,
  };
}
