export const publishingPlatforms = [
  {
    value: "tiktok",
    tag: "tiktok",
    label: "TikTok",
    shortLabel: "TikTok",
  },
  {
    value: "instagram",
    tag: "reels",
    label: "Instagram Reels",
    shortLabel: "Reels",
  },
  {
    value: "youtube",
    tag: "shorts",
    label: "YouTube Shorts",
    shortLabel: "Shorts",
  },
] as const;

export type PublishingPlatform = (typeof publishingPlatforms)[number]["value"];
export type PublishingPlatformTag = (typeof publishingPlatforms)[number]["tag"];

export function isPublishingPlatform(
  value: string,
): value is PublishingPlatform {
  return publishingPlatforms.some((platform) => platform.value === value);
}

export function getPlatformOption(platform: PublishingPlatform) {
  return (
    publishingPlatforms.find((option) => option.value === platform) ??
    publishingPlatforms[0]
  );
}

export function getPlatformTag(
  platform: PublishingPlatform,
): PublishingPlatformTag {
  return getPlatformOption(platform).tag;
}
