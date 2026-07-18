const taggedLinkPlatforms = ["tiktok", "reels", "shorts"] as const;

export type TaggedLinkPlatform = (typeof taggedLinkPlatforms)[number];

export type TaggedLinkInput = {
  contentItemId: string;
  platform: TaggedLinkPlatform;
  destinationUrl: string;
};

export function isTaggedLinkPlatform(
  platform: string,
): platform is TaggedLinkPlatform {
  return taggedLinkPlatforms.includes(platform as TaggedLinkPlatform);
}

export function buildTaggedContentLink({
  contentItemId,
  platform,
  destinationUrl,
}: TaggedLinkInput) {
  if (!contentItemId.trim()) {
    throw new Error("contentItemId is required");
  }

  if (!isTaggedLinkPlatform(platform)) {
    throw new Error("platform must be tiktok, reels, or shorts");
  }

  const url = parseDestinationUrl(destinationUrl);
  url.searchParams.set("utm_source", platform);
  url.searchParams.set("utm_content", contentItemId);

  return serializeTaggedUrl(destinationUrl, url);
}

export function buildUtmTaggedLink(
  contentItemId: string,
  platform: TaggedLinkPlatform,
  destinationUrl: string,
) {
  return buildTaggedContentLink({
    contentItemId,
    platform,
    destinationUrl,
  });
}

function parseDestinationUrl(destinationUrl: string) {
  const trimmedUrl = destinationUrl.trim();

  if (!trimmedUrl) {
    throw new Error("destinationUrl is required");
  }

  const hasProtocol = /^[a-z][a-z\d+\-.]*:/i.test(trimmedUrl);
  const base =
    hasProtocol || trimmedUrl.startsWith("/")
      ? trimmedUrl
      : `https://${trimmedUrl}`;

  return new URL(base, "https://fastlane.local");
}

function serializeTaggedUrl(originalUrl: string, parsedUrl: URL) {
  const trimmedUrl = originalUrl.trim();
  const hasProtocol = /^[a-z][a-z\d+\-.]*:/i.test(trimmedUrl);

  if (hasProtocol || !trimmedUrl.startsWith("/")) {
    return parsedUrl.toString();
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}
