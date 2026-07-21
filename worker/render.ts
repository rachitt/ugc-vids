import { mkdir } from "node:fs/promises";
import path from "node:path";

import { renderMedia, selectComposition } from "@remotion/renderer";

import { normalizeRenderJobData } from "../src/lib/video/render-jobs";
import type { NormalizedRenderJob } from "../src/lib/video/render-jobs";
import type { RenderJobData } from "../src/lib/jobs/queues";
import { createVideoStorageFromEnv } from "../src/lib/storage/video-storage";
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

async function readStorageKeyAsDataUri(key: string): Promise<string> {
  const storage = createVideoStorageFromEnv();
  const stored = await storage.getStream(key);
  const chunks: Buffer[] = [];

  for await (const chunk of stored.stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const contentType = stored.contentType ?? "image/png";

  return `data:${contentType};base64,${Buffer.concat(chunks).toString("base64")}`;
}

// Site captures are stored behind the authenticated /api/videos route, which
// Remotion's headless render page cannot fetch (relative URL + no session).
// Inline them as data URIs so the renderer needs no network access at all.
async function inlineHookDemoCaptures(
  props: NormalizedRenderJob["props"],
): Promise<NormalizedRenderJob["props"]> {
  const hookDemo = props.hookDemo;

  if (!hookDemo?.captures?.length) {
    return props;
  }

  const captures = await Promise.all(
    hookDemo.captures.map(async (capture) => {
      const match = /^\/api\/videos\/(.+)$/.exec(capture.src);

      if (!match) {
        return capture;
      }

      return {
        ...capture,
        src: await readStorageKeyAsDataUri(decodeURIComponent(match[1])),
      };
    }),
  );

  return { ...props, hookDemo: { ...hookDemo, captures } };
}

export async function renderVideoJob(
  rawJobData: RenderVideoJobData,
  uploader: RenderedVideoUploader,
): Promise<RenderVideoResult> {
  const job = normalizeRenderJobData(rawJobData);
  job.props = await inlineHookDemoCaptures(job.props);
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
