"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { batchGenerationRequester } from "@/lib/content/generation-contract";
import {
  promptRecipeForTrendTemplate,
  serializePromptRecipeForGeneration,
  TREND_REMIX_VARIANT_COUNT,
} from "@/lib/content/trend-generation";
import { getTrendTemplateById } from "@/lib/trends/queries";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

type TrendingRedirectTarget =
  | "/trending?remix=created&count=0"
  | "/trending?remix=created&count=1"
  | "/trending?remix=created&count=2"
  | "/trending?remix=created&count=3"
  | "/trending?remix=failed"
  | "/trending?remix=missing-trend"
  | "/trending?remix=missing-workspace"
  | "/trending?remix=needs-profile";

function redirectToTrending(target: TrendingRedirectTarget): never {
  redirect(target as Route);
}

function redirectToCreatedRemixes(count: number): never {
  switch (count) {
    case 0:
      return redirectToTrending("/trending?remix=created&count=0");
    case 1:
      return redirectToTrending("/trending?remix=created&count=1");
    case 2:
      return redirectToTrending("/trending?remix=created&count=2");
    default:
      return redirectToTrending("/trending?remix=created&count=3");
  }
}

export async function remixTrendAction(formData: FormData) {
  const trendId = String(formData.get("trendId") ?? "");

  if (!trendId) {
    redirectToTrending("/trending?remix=missing-trend");
  }

  const trendTemplate = await getTrendTemplateById(trendId);

  if (!trendTemplate || !trendTemplate.contentFormat) {
    redirectToTrending("/trending?remix=missing-trend");
  }

  const { workspace } = await getActiveWorkspaceContext();

  const promptRecipe = promptRecipeForTrendTemplate(trendTemplate);
  const result = await batchGenerationRequester.requestGeneration({
    promptRecipe: serializePromptRecipeForGeneration(promptRecipe),
    reason: "manual_request",
    requestedFormats: [trendTemplate.contentFormat],
    source: "trending_remix",
    targetCount: TREND_REMIX_VARIANT_COUNT,
    trendTemplateId: trendTemplate.id,
    workspaceId: workspace.id,
  });

  if (result.status === "blocked") {
    redirectToTrending("/trending?remix=needs-profile");
  }

  if (result.status !== "generated") {
    redirectToTrending("/trending?remix=failed");
  }

  revalidatePath("/content");
  revalidatePath("/trending");
  redirectToCreatedRemixes(result.generatedCount ?? 0);
}
