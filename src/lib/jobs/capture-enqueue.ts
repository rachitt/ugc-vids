import { createScrapeQueue } from "./queues";

export type EnqueueBrandProfileCaptureInput = {
  brandProfileId: string;
  url: string;
};

export async function enqueueBrandProfileCapture({
  brandProfileId,
  url,
}: EnqueueBrandProfileCaptureInput) {
  const queue = createScrapeQueue();

  try {
    const job = await queue.add(
      "capture",
      {
        brandProfileId,
        url,
      },
      {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    return {
      brandProfileId,
      jobId: typeof job.id === "undefined" ? null : String(job.id),
    };
  } finally {
    await queue.close();
  }
}
