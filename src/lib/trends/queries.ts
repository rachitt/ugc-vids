import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { trendTemplates } from "@/lib/db/schema";
import {
  compositionIdForFormat,
  compositionIds,
  formatForCompositionId,
  type ContentFormat,
  type RemotionCompositionId,
} from "@/lib/video/remotion-props";

import { parseTrendTemplateMetadata } from "./metadata";

export const remotionTemplateLabels: Record<RemotionCompositionId, string> = {
  "greenscreen-meme": "Greenscreen meme",
  "hook-demo": "Hook demo",
  slideshow: "Slideshow",
  "wall-of-text": "Wall of text",
};

export type TrendTemplateRecord = typeof trendTemplates.$inferSelect;

export type TrendTemplateView = TrendTemplateRecord & {
  contentFormat: ContentFormat | null;
  metadata: ReturnType<typeof parseTrendTemplateMetadata>;
  remotionTemplateLabel: string;
};

export type TrendTemplateFilters = {
  format?: RemotionCompositionId;
  nicheTag?: string;
};

export type TrendTemplateFilterOptions = {
  formats: Array<{
    id: RemotionCompositionId;
    label: string;
  }>;
  nicheTags: string[];
};

export function isRemotionCompositionId(
  value: string | undefined,
): value is RemotionCompositionId {
  return compositionIds.includes(value as RemotionCompositionId);
}

export function normalizeRemotionTemplateId(
  value: string,
): RemotionCompositionId | null {
  if (isRemotionCompositionId(value)) {
    return value;
  }

  const format = formatForCompositionId(value);

  if (!format) {
    return null;
  }

  return compositionIdForFormat(format);
}

export function labelForRemotionTemplateId(templateId: string): string {
  const normalized = normalizeRemotionTemplateId(templateId);

  if (!normalized) {
    return "Unknown format";
  }

  return remotionTemplateLabels[normalized];
}

export function hydrateTrendTemplate(
  row: TrendTemplateRecord,
): TrendTemplateView {
  const normalizedTemplateId = normalizeRemotionTemplateId(
    row.remotionTemplateId,
  );
  const contentFormat = normalizedTemplateId
    ? formatForCompositionId(normalizedTemplateId)
    : null;

  return {
    ...row,
    contentFormat,
    metadata: parseTrendTemplateMetadata(row.exampleRef),
    remotionTemplateLabel: labelForRemotionTemplateId(row.remotionTemplateId),
  };
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export async function listTrendTemplates(
  filters: TrendTemplateFilters = {},
): Promise<TrendTemplateView[]> {
  const rows = await db
    .select()
    .from(trendTemplates)
    .orderBy(asc(trendTemplates.title));
  const nicheTag = filters.nicheTag
    ? normalizeTag(filters.nicheTag)
    : undefined;

  return rows.map(hydrateTrendTemplate).filter((trend) => {
    if (
      filters.format &&
      normalizeRemotionTemplateId(trend.remotionTemplateId) !== filters.format
    ) {
      return false;
    }

    if (
      nicheTag &&
      !trend.nicheTags.some((tag) => normalizeTag(tag) === nicheTag)
    ) {
      return false;
    }

    return true;
  });
}

export async function getTrendTemplateById(
  id: string,
): Promise<TrendTemplateView | null> {
  const [row] = await db
    .select()
    .from(trendTemplates)
    .where(eq(trendTemplates.id, id))
    .limit(1);

  return row ? hydrateTrendTemplate(row) : null;
}

export async function getTrendTemplateFilterOptions(): Promise<TrendTemplateFilterOptions> {
  const trends = await listTrendTemplates();
  const nicheTags = new Set<string>();
  const activeFormats = new Set<RemotionCompositionId>();

  for (const trend of trends) {
    for (const tag of trend.nicheTags) {
      nicheTags.add(normalizeTag(tag));
    }

    const remotionTemplateId = normalizeRemotionTemplateId(
      trend.remotionTemplateId,
    );

    if (remotionTemplateId) {
      activeFormats.add(remotionTemplateId);
    }
  }

  return {
    formats: compositionIds
      .filter((id) => activeFormats.has(id))
      .map((id) => ({
        id,
        label: remotionTemplateLabels[id],
      })),
    nicheTags: Array.from(nicheTags).sort(),
  };
}
