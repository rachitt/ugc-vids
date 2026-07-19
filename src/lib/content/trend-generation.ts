import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import type { PromptRecipe } from "@/lib/trends/metadata";
import { createFallbackPromptRecipe } from "@/lib/trends/metadata";
import type { TrendTemplateView } from "@/lib/trends/queries";

export const TREND_REMIX_VARIANT_COUNT = 3;

type PromptRecipeTrendTemplate = Pick<
  TrendTemplateView,
  "metadata" | "structureDescription" | "title"
>;

export function promptRecipeForTrendTemplate(
  trendTemplate: PromptRecipeTrendTemplate,
): PromptRecipe {
  return (
    trendTemplate.metadata?.promptRecipe ??
    createFallbackPromptRecipe(
      trendTemplate.title,
      trendTemplate.structureDescription,
    )
  );
}

export function serializePromptRecipeForGeneration(
  promptRecipe: PromptRecipe,
): string {
  return JSON.stringify(promptRecipe);
}

export async function getDefaultGenerationWorkspaceId(): Promise<
  string | null
> {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .orderBy(asc(workspaces.createdAt))
    .limit(1);

  return workspace?.id ?? null;
}
