import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { CalendarClient } from "@/app/calendar/calendar-client";
import type {
  CalendarContentItem,
  CalendarSlot,
  CalendarWorkspace,
} from "@/app/calendar/types";
import { getContentFormatLabel } from "@/lib/content/formats";
import { db } from "@/lib/db";
import { calendarSlots, contentItems } from "@/lib/db/schema";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type CalendarData =
  | {
      workspace: CalendarWorkspace | null;
      contentItems: CalendarContentItem[];
      slots: CalendarSlot[];
      loadError?: undefined;
    }
  | {
      workspace: null;
      contentItems: [];
      slots: [];
      loadError: string;
    };

const libraryStatuses = ["saved", "scheduled", "exported", "posted"] as const;

export default async function CalendarPage() {
  const data = await getCalendarData();

  return <CalendarClient {...data} />;
}

async function getCalendarData(): Promise<CalendarData> {
  try {
    const { workspace } = await getActiveWorkspaceContext();

    const itemRows = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, workspace.id),
          inArray(contentItems.status, [...libraryStatuses]),
        ),
      )
      .orderBy(desc(contentItems.createdAt));

    const workspaceItems = itemRows;
    const itemMap = new Map(
      workspaceItems.map((item) => [item.id, serializeContentItem(item)]),
    );

    const slotRows = await db
      .select({
        slot: calendarSlots,
        item: contentItems,
      })
      .from(calendarSlots)
      .innerJoin(contentItems, eq(calendarSlots.contentItemId, contentItems.id))
      .where(eq(contentItems.workspaceId, workspace.id))
      .orderBy(asc(calendarSlots.scheduledAt));

    const slots = slotRows.map(({ slot, item }) => ({
      id: slot.id,
      contentItemId: slot.contentItemId,
      platform: slot.platform,
      scheduledAt: slot.scheduledAt.toISOString(),
      status: slot.status,
      item: itemMap.get(item.id) ?? serializeContentItem(item),
    }));

    return {
      workspace,
      contentItems: workspaceItems.map(serializeContentItem),
      slots,
    };
  } catch (error) {
    return {
      workspace: null,
      contentItems: [],
      slots: [],
      loadError:
        error instanceof Error
          ? error.message
          : "Calendar data could not be loaded.",
    };
  }
}

function serializeContentItem(
  item: typeof contentItems.$inferSelect,
): CalendarContentItem {
  const script = item.script ?? {};
  const previewParts = [
    script.hook,
    ...(script.slides ?? []),
    ...(script.lines ?? []),
  ].filter(Boolean);

  return {
    id: item.id,
    format: item.format,
    status: item.status,
    renderStatus: item.renderStatus,
    videoUrl: item.videoUrl,
    thumbUrl: item.thumbUrl,
    hook: script.hook ?? getContentFormatLabel(item.format),
    caption: script.caption ?? "",
    hashtags: script.hashtags ?? [],
    preview: previewParts.slice(0, 3).join(" / "),
    createdAt: item.createdAt.toISOString(),
  };
}
