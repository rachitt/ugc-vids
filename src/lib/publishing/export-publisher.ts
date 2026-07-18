import { getPlatformTag } from "@/lib/publishing/platforms";
import type {
  PublishableCalendarSlot,
  PublishableContentItem,
  Publisher,
  PublishResult,
} from "@/lib/publishing/types";
import { PublisherError } from "@/lib/publishing/types";

type ExportPublisherOptions = {
  appUrl?: string;
  downloadUrlForSlot?: (
    item: PublishableContentItem,
    slot: PublishableCalendarSlot,
  ) => string;
  markExported?: (
    item: PublishableContentItem,
    slot: PublishableCalendarSlot,
  ) => Promise<void>;
};

const defaultCampaign = "fastlane_calendar";

export class ExportPublisher implements Publisher {
  private readonly appUrl: string;
  private readonly downloadUrlForSlot: NonNullable<
    ExportPublisherOptions["downloadUrlForSlot"]
  >;
  private readonly markExported?: ExportPublisherOptions["markExported"];

  constructor(options: ExportPublisherOptions = {}) {
    this.appUrl = options.appUrl ?? "http://localhost:3000";
    this.downloadUrlForSlot =
      options.downloadUrlForSlot ??
      ((_item, slot) => `/calendar/download/${slot.id}`);
    this.markExported = options.markExported;
  }

  async publish(
    item: PublishableContentItem,
    slot: PublishableCalendarSlot,
  ): Promise<PublishResult> {
    if (!item.videoUrl) {
      throw new PublisherError("Content item is missing a video_url.");
    }

    await this.markExported?.(item, slot);

    const platformTag = getPlatformTag(slot.platform);
    const caption =
      item.script.caption?.trim() || item.script.hook?.trim() || "";
    const hashtags = normalizeHashtags(item.script.hashtags ?? []);
    const destinationUrl = buildUtmUrl(
      getLandingPageUrl(item, this.appUrl),
      platformTag,
      item.id,
    );
    const copyText = [caption, hashtags.join(" "), destinationUrl]
      .filter(Boolean)
      .join("\n\n");

    return {
      provider: "export",
      slotId: slot.id,
      contentItemId: item.id,
      platform: slot.platform,
      platformTag,
      status: "exported",
      sourceVideoUrl: item.videoUrl,
      downloadUrl: this.downloadUrlForSlot(item, slot),
      fileName: buildFileName(item, platformTag),
      caption,
      hashtags,
      destinationUrl,
      copyText,
    };
  }
}

function normalizeHashtags(hashtags: string[]) {
  return hashtags
    .map((hashtag) => hashtag.trim())
    .filter(Boolean)
    .map((hashtag) => (hashtag.startsWith("#") ? hashtag : `#${hashtag}`));
}

function getLandingPageUrl(item: PublishableContentItem, appUrl: string) {
  const landingPageUrl = item.remotionProps.landingPageUrl;
  const websiteUrl = item.remotionProps.websiteUrl;

  if (typeof landingPageUrl === "string" && landingPageUrl.trim()) {
    return landingPageUrl;
  }

  if (typeof websiteUrl === "string" && websiteUrl.trim()) {
    return websiteUrl;
  }

  return appUrl;
}

function buildUtmUrl(
  destination: string,
  platformTag: string,
  contentItemId: string,
) {
  try {
    const url = new URL(destination);
    url.searchParams.set("utm_source", platformTag);
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", defaultCampaign);
    url.searchParams.set("utm_content", contentItemId);
    return url.toString();
  } catch {
    const separator = destination.includes("?") ? "&" : "?";
    const query = new URLSearchParams({
      utm_source: platformTag,
      utm_medium: "social",
      utm_campaign: defaultCampaign,
      utm_content: contentItemId,
    });

    return `${destination}${separator}${query.toString()}`;
  }
}

function buildFileName(item: PublishableContentItem, platformTag: string) {
  const hook = item.script.hook ?? item.script.caption ?? item.id;
  const slug = hook
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const fallbackSlug = item.id.slice(0, 8);

  return `${platformTag}-${slug || fallbackSlug}-${fallbackSlug}.mp4`;
}
