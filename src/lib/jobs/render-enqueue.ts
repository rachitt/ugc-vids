import { eq } from "drizzle-orm";

import { isRenderableContentFormat } from "../content/formats";
import { db } from "../db";
import { contentItems } from "../db/schema";
import {
  compositionIdForFormat,
  validateRemotionProps,
} from "../video/remotion-props";
import { createRenderQueue } from "./queues";

export type RenderableContentStatus = "exported" | "saved";

export type EnqueueContentItemRenderResult = {
  contentItemId: string;
  jobId: string | null;
  renderStatus: "queued";
  status: RenderableContentStatus;
};

type EnqueueContentItemRenderInput = {
  contentItemId: string;
  status: RenderableContentStatus;
};

export async function enqueueContentItemRender({
  contentItemId,
  status,
}: EnqueueContentItemRenderInput): Promise<EnqueueContentItemRenderResult> {
  const [item] = await db
    .select({
      format: contentItems.format,
      id: contentItems.id,
      remotionProps: contentItems.remotionProps,
      workspaceId: contentItems.workspaceId,
    })
    .from(contentItems)
    .where(eq(contentItems.id, contentItemId))
    .limit(1);

  if (!item) {
    throw new Error("Content item not found.");
  }

  if (!isRenderableContentFormat(item.format)) {
    throw new Error(`Content format ${item.format} cannot be rendered yet.`);
  }

  const props = validateRemotionProps(item.remotionProps);

  if (props.format !== item.format) {
    throw new Error("Content item format does not match its Remotion props.");
  }

  const compositionId = compositionIdForFormat(props.format);
  const queue = createRenderQueue();

  try {
    const job = await queue.add(
      "render-video",
      {
        compositionId,
        contentItemId: item.id,
        props: props as unknown as Record<string, unknown>,
        workspaceId: item.workspaceId,
      },
      {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    await db
      .update(contentItems)
      .set({
        renderStatus: "queued",
        status,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, item.id));

    return {
      contentItemId: item.id,
      jobId: typeof job.id === "undefined" ? null : String(job.id),
      renderStatus: "queued",
      status,
    };
  } catch (error) {
    await db
      .update(contentItems)
      .set({
        renderStatus: "failed",
        status,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, item.id));

    throw error;
  } finally {
    await queue.close();
  }
}
