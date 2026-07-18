"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getDefaultGenerationWorkspaceId,
  stubGenerationRequester,
} from "@/lib/content/trend-generation";
import { getTrendTemplateById } from "@/lib/trends/queries";

export async function remixTrendAction(formData: FormData) {
  const trendId = String(formData.get("trendId") ?? "");

  if (!trendId) {
    redirect("/trending?remix=missing-trend" as Route);
  }

  const trendTemplate = await getTrendTemplateById(trendId);

  if (!trendTemplate) {
    redirect("/trending?remix=missing-trend" as Route);
  }

  const workspaceId = await getDefaultGenerationWorkspaceId();

  if (!workspaceId) {
    redirect("/trending?remix=missing-workspace" as Route);
  }

  await stubGenerationRequester.requestGeneration({
    source: "trending_remix",
    trendTemplate,
    workspaceId,
  });

  revalidatePath("/trending");
  redirect("/trending?remix=created" as Route);
}
