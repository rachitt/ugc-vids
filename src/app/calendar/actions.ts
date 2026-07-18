"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { calendarSlots, contentItems } from "@/lib/db/schema";
import { ExportPublisher, isPublishingPlatform } from "@/lib/publishing";
import { PublisherError } from "@/lib/publishing";
import type { PublishingPlatform } from "@/lib/publishing/platforms";

type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

type ScheduleSlotInput = {
  contentItemId: string;
  platform: string;
  scheduledAt: string;
};

const schedulableStatuses = new Set([
  "saved",
  "scheduled",
  "exported",
  "posted",
]);

export async function scheduleContentItemAction(
  input: ScheduleSlotInput,
): Promise<ActionResult<{ slotId: string }>> {
  try {
    if (!isPublishingPlatform(input.platform)) {
      return { ok: false, error: "Unsupported platform." };
    }

    const scheduledAt = new Date(input.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      return { ok: false, error: "Invalid scheduled date." };
    }

    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, input.contentItemId))
      .limit(1);

    if (!item) {
      return { ok: false, error: "Content item was not found." };
    }

    if (!schedulableStatuses.has(item.status)) {
      return {
        ok: false,
        error: "Only saved content can be added to the calendar.",
      };
    }

    const now = new Date();
    const [slot] = await db
      .insert(calendarSlots)
      .values({
        contentItemId: item.id,
        platform: input.platform,
        scheduledAt,
        status: "planned",
        updatedAt: now,
      })
      .returning({ id: calendarSlots.id });

    if (item.status === "saved") {
      await db
        .update(contentItems)
        .set({
          status: "scheduled",
          updatedAt: now,
        })
        .where(eq(contentItems.id, item.id));
    }

    revalidatePath("/calendar");

    return { ok: true, data: { slotId: slot.id } };
  } catch (error) {
    return {
      ok: false,
      error: getActionErrorMessage(error, "Could not schedule content."),
    };
  }
}

export async function exportCalendarSlotAction(slotId: string): Promise<
  ActionResult<{
    downloadUrl: string;
    fileName: string;
    copyText: string;
    caption: string;
    hashtags: string[];
    destinationUrl: string;
  }>
> {
  try {
    const [row] = await db
      .select({
        slot: calendarSlots,
        item: contentItems,
      })
      .from(calendarSlots)
      .innerJoin(contentItems, eq(calendarSlots.contentItemId, contentItems.id))
      .where(eq(calendarSlots.id, slotId))
      .limit(1);

    if (!row) {
      return { ok: false, error: "Calendar slot was not found." };
    }

    if (row.slot.status === "posted_manual") {
      return { ok: false, error: "This slot is already marked posted." };
    }

    const publisher = new ExportPublisher({
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      markExported: async () => {
        const now = new Date();

        await db
          .update(calendarSlots)
          .set({
            status: "exported",
            updatedAt: now,
          })
          .where(eq(calendarSlots.id, row.slot.id));

        if (row.item.status !== "posted") {
          await db
            .update(contentItems)
            .set({
              status: "exported",
              updatedAt: now,
            })
            .where(eq(contentItems.id, row.item.id));
        }
      },
    });

    const result = await publisher.publish(row.item, {
      ...row.slot,
      platform: row.slot.platform as PublishingPlatform,
    });

    revalidatePath("/calendar");

    return {
      ok: true,
      data: {
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        copyText: result.copyText,
        caption: result.caption,
        hashtags: result.hashtags,
        destinationUrl: result.destinationUrl,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: getActionErrorMessage(error, "Could not export content."),
    };
  }
}

export async function markCalendarSlotPostedAction(
  slotId: string,
): Promise<ActionResult<{ slotId: string }>> {
  try {
    const [row] = await db
      .select({
        slot: calendarSlots,
        item: contentItems,
      })
      .from(calendarSlots)
      .innerJoin(contentItems, eq(calendarSlots.contentItemId, contentItems.id))
      .where(eq(calendarSlots.id, slotId))
      .limit(1);

    if (!row) {
      return { ok: false, error: "Calendar slot was not found." };
    }

    if (row.slot.status !== "exported" && row.slot.status !== "posted_manual") {
      return { ok: false, error: "Export this slot before marking it posted." };
    }

    const now = new Date();

    await db
      .update(calendarSlots)
      .set({
        status: "posted_manual",
        updatedAt: now,
      })
      .where(eq(calendarSlots.id, row.slot.id));

    await db
      .update(contentItems)
      .set({
        status: "posted",
        updatedAt: now,
      })
      .where(eq(contentItems.id, row.item.id));

    revalidatePath("/calendar");

    return { ok: true, data: { slotId: row.slot.id } };
  } catch (error) {
    return {
      ok: false,
      error: getActionErrorMessage(error, "Could not mark slot posted."),
    };
  }
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof PublisherError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
