import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { brandProfiles } from "../db/schema";
import type { ContentFormat } from "../video/remotion-props";
import {
  buildMixedFormatPlan,
  clampBatchSize,
  DEFAULT_MIXED_BATCH_SIZE,
} from "./formats";
import {
  generateContentItems,
  type ContentGenerationError,
  type GeneratedContentItem,
} from "./generation";

export type MixedContentBatchError = ContentGenerationError & {
  batchIndex: number;
};

export type MixedContentBatchResult = {
  errors: MixedContentBatchError[];
  failedCount: number;
  generatedCount: number;
  items: GeneratedContentItem[];
  plan: ContentFormat[];
  requestedCount: number;
};

type GenerateMixedContentBatchInput = {
  brandProfileId: string;
  totalCount?: number;
  workspaceId: string;
};

export async function generateMixedContentBatch({
  brandProfileId,
  totalCount = DEFAULT_MIXED_BATCH_SIZE,
  workspaceId,
}: GenerateMixedContentBatchInput): Promise<MixedContentBatchResult> {
  const [brandProfile] = await db
    .select()
    .from(brandProfiles)
    .where(
      and(
        eq(brandProfiles.id, brandProfileId),
        eq(brandProfiles.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  if (!brandProfile) {
    throw new Error("Brand profile not found for this workspace.");
  }

  const plan = buildMixedFormatPlan(clampBatchSize(totalCount));
  const items: GeneratedContentItem[] = [];
  const errors: MixedContentBatchError[] = [];

  for (let index = 0; index < plan.length; index += 1) {
    const format = plan[index];

    try {
      const result = await generateContentItems({
        brandProfile,
        count: 1,
        format,
      });

      items.push(...result.items);
      errors.push(
        ...result.errors.map((error) => ({
          ...error,
          batchIndex: index,
        })),
      );

      if (result.items.length === 0 && result.errors.length === 0) {
        errors.push({
          batchIndex: index,
          format,
          message: "No content item was generated.",
          scriptIndex: 0,
        });
      }
    } catch (error) {
      errors.push({
        batchIndex: index,
        format,
        message: toErrorMessage(error),
        scriptIndex: 0,
      });
    }
  }

  return {
    errors,
    failedCount: errors.length,
    generatedCount: items.length,
    items,
    plan,
    requestedCount: plan.length,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Content generation failed.";
}
