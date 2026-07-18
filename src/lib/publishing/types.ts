import type {
  PublishingPlatform,
  PublishingPlatformTag,
} from "@/lib/publishing/platforms";

export type PublishableContentScript = {
  hook?: string;
  slides?: string[];
  lines?: string[];
  caption?: string;
  hashtags?: string[];
};

export type PublishableContentItem = {
  id: string;
  script: PublishableContentScript;
  remotionProps: Record<string, unknown>;
  videoUrl: string | null;
};

export type PublishableCalendarSlot = {
  id: string;
  platform: PublishingPlatform;
  scheduledAt: Date;
  status: "planned" | "exported" | "posted_manual";
};

export type PublishResult = {
  provider: string;
  slotId: string;
  contentItemId: string;
  platform: PublishingPlatform;
  platformTag: PublishingPlatformTag;
  status: "exported";
  sourceVideoUrl: string;
  downloadUrl: string;
  fileName: string;
  caption: string;
  hashtags: string[];
  destinationUrl: string;
  copyText: string;
};

export interface Publisher {
  publish(
    item: PublishableContentItem,
    slot: PublishableCalendarSlot,
  ): Promise<PublishResult>;
}

export class PublisherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublisherError";
  }
}
