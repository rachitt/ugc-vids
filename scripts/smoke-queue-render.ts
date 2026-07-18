import { desc, eq, isNotNull } from "drizzle-orm";

import { db } from "../src/lib/db";
import { contentItems } from "../src/lib/db/schema";
import { enqueueContentItemRender } from "../src/lib/jobs/render-enqueue";
import { validateRemotionProps } from "../src/lib/video/remotion-props";

async function main() {
  const candidates = await db
    .select()
    .from(contentItems)
    .where(isNotNull(contentItems.remotionProps))
    .orderBy(desc(contentItems.createdAt))
    .limit(50);

  const item = candidates.find((candidate) => {
    try {
      validateRemotionProps(candidate.remotionProps);
      return true;
    } catch {
      return false;
    }
  });

  if (!item) {
    throw new Error("No content item with valid remotion props found.");
  }

  await db
    .update(contentItems)
    .set({ status: "saved" })
    .where(eq(contentItems.id, item.id));

  const result = await enqueueContentItemRender({
    contentItemId: item.id,
    status: "saved",
  });
  console.log("ENQUEUED", item.id, item.format, JSON.stringify(result));

  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 5000));
    const [row] = await db
      .select({
        renderStatus: contentItems.renderStatus,
        videoUrl: contentItems.videoUrl,
      })
      .from(contentItems)
      .where(eq(contentItems.id, item.id));
    console.log("status:", row?.renderStatus, row?.videoUrl ?? "");
    if (row?.renderStatus === "rendered" || row?.renderStatus === "failed") {
      if (row.renderStatus === "failed") process.exit(1);
      return;
    }
  }
  throw new Error("Timed out waiting for render.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
