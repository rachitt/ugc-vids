import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

export const renderQueueName = "render";
export const scrapeQueueName = "scrape";

export type RenderJobData = {
  contentItemId: string;
  compositionId: string;
  props: Record<string, unknown>;
  workspaceId: string;
};

export type ScrapeJobData = {
  brandProfileId: string;
  url: string;
};

export function getRedisConnectionOptions(): RedisOptions {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
  };
}

export function createRenderQueue() {
  return new Queue<RenderJobData>(renderQueueName, {
    connection: getRedisConnectionOptions(),
  });
}

export function createScrapeQueue() {
  return new Queue<ScrapeJobData>(scrapeQueueName, {
    connection: getRedisConnectionOptions(),
  });
}
