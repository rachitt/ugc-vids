import "dotenv/config";

import { Worker } from "bullmq";

import {
  getRedisConnectionOptions,
  renderQueueName,
  scrapeQueueName,
  type RenderJobData,
  type ScrapeJobData,
} from "../src/lib/jobs/queues";
import {
  markContentItemRenderCompleted,
  markContentItemRenderFailed,
  markContentItemRenderStarted,
} from "../src/lib/jobs/render-status";
import { renderVideoJob } from "./render";
import { RenderedVideoStorageUploader } from "./r2-upload";

const connection = getRedisConnectionOptions();
const renderedVideoUploader = new RenderedVideoStorageUploader();

const renderWorker = new Worker<RenderJobData>(
  renderQueueName,
  async (job) => {
    console.info("Render worker received job", {
      compositionId: job.data.compositionId,
      contentItemId: job.data.contentItemId,
      jobId: job.id,
      workspaceId: job.data.workspaceId ?? "unknown",
    });

    await markContentItemRenderStarted(job.data.contentItemId);

    try {
      const result = await renderVideoJob(job.data, renderedVideoUploader);

      await markContentItemRenderCompleted({
        contentItemId: result.contentItemId,
        videoUrl: result.videoUrl,
      });

      console.info("Render worker finished job", {
        contentItemId: result.contentItemId,
        jobId: job.id,
        localPath: result.localPath,
        videoUrl: result.videoUrl,
      });

      return result;
    } catch (error) {
      await markContentItemRenderFailed(job.data.contentItemId);
      throw error;
    }
  },
  { connection },
);

const scrapeWorker = new Worker<ScrapeJobData>(
  scrapeQueueName,
  async (job) => {
    console.info("Scrape worker received stub job", {
      brandProfileId: job.data.brandProfileId,
      jobId: job.id,
      url: job.data.url,
    });

    return {
      scrapeStatus: "stubbed",
    };
  },
  { connection },
);

async function shutdown(signal: NodeJS.Signals) {
  console.info(`Received ${signal}; closing workers.`);
  await Promise.all([renderWorker.close(), scrapeWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.info("Fastlane worker skeleton started", {
  queues: [renderQueueName, scrapeQueueName],
});
