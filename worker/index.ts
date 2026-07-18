import "dotenv/config";

import { Worker } from "bullmq";

import {
  getRedisConnectionOptions,
  renderQueueName,
  scrapeQueueName,
  type RenderJobData,
  type ScrapeJobData,
} from "../src/lib/jobs/queues";

const connection = getRedisConnectionOptions();

const renderWorker = new Worker<RenderJobData>(
  renderQueueName,
  async (job) => {
    console.info("Render worker received stub job", {
      compositionId: job.data.compositionId,
      contentItemId: job.data.contentItemId,
      jobId: job.id,
    });

    return {
      renderStatus: "stubbed",
    };
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
