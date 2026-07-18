import { eq } from "drizzle-orm";

import { db } from "../db";
import { contentItems } from "../db/schema";

export async function markContentItemRenderStarted(contentItemId: string) {
  await db
    .update(contentItems)
    .set({
      renderStatus: "rendering",
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, contentItemId));
}

export async function markContentItemRenderCompleted({
  contentItemId,
  videoUrl,
}: {
  contentItemId: string;
  videoUrl: string;
}) {
  await db
    .update(contentItems)
    .set({
      renderStatus: "rendered",
      updatedAt: new Date(),
      videoUrl,
    })
    .where(eq(contentItems.id, contentItemId));
}

export async function markContentItemRenderFailed(contentItemId: string) {
  await db
    .update(contentItems)
    .set({
      renderStatus: "failed",
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, contentItemId));
}
