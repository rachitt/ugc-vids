import type { ContentFormat } from "@/lib/content/formats";
import type { PublishingPlatform } from "@/lib/publishing/platforms";

export type CalendarView = "week" | "month";

export type CalendarItemStatus =
  "generated" | "saved" | "rejected" | "scheduled" | "exported" | "posted";

export type CalendarSlotStatus = "planned" | "exported" | "posted_manual";

export type CalendarContentItem = {
  id: string;
  format: ContentFormat;
  status: CalendarItemStatus;
  renderStatus: "idle" | "queued" | "rendering" | "rendered" | "failed";
  videoUrl: string | null;
  thumbUrl: string | null;
  hook: string;
  caption: string;
  hashtags: string[];
  preview: string;
  createdAt: string;
};

export type CalendarSlot = {
  id: string;
  contentItemId: string;
  platform: PublishingPlatform;
  scheduledAt: string;
  status: CalendarSlotStatus;
  item: CalendarContentItem;
};

export type CalendarWorkspace = {
  id: string;
  name: string;
};
