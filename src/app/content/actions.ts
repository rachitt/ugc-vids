"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { generateMixedContentBatch } from "@/lib/content/batch";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import {
  enqueueContentItemRender,
  type RenderableContentStatus,
} from "@/lib/jobs/render-enqueue";

export async function generateContentBatchAction(formData: FormData) {
  const workspaceId = getRequiredFormValue(formData, "workspaceId");
  const brandProfileId = getRequiredFormValue(formData, "brandProfileId");
  const totalCount = getOptionalNumber(formData, "totalCount") ?? 12;
  let generatedCount = 0;
  let failedCount = 0;

  try {
    const result = await generateMixedContentBatch({
      brandProfileId,
      totalCount,
      workspaceId,
    });

    generatedCount = result.generatedCount;
    failedCount = result.failedCount;
  } catch (error) {
    redirect(
      `/content?brandProfileId=${encodeURIComponent(
        brandProfileId,
      )}&error=${encodeURIComponent(toActionErrorMessage(error))}` as Route,
    );
  }

  revalidatePath("/content");
  redirect(
    `/content?brandProfileId=${encodeURIComponent(
      brandProfileId,
    )}&generated=${generatedCount}&failed=${failedCount}` as Route,
  );
}

export async function saveContentItemAction(formData: FormData) {
  await updateContentItemAndEnqueueRender(formData, "saved");
}

export async function exportContentItemAction(formData: FormData) {
  await updateContentItemAndEnqueueRender(formData, "exported");
}

export async function rejectContentItemAction(formData: FormData) {
  const contentItemId = getRequiredFormValue(formData, "contentItemId");

  try {
    await db
      .update(contentItems)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, contentItemId));
  } catch (error) {
    redirect(
      `/content?error=${encodeURIComponent(toActionErrorMessage(error))}` as Route,
    );
  }

  revalidatePath("/content");
  redirect("/content?rejected=1" as Route);
}

async function updateContentItemAndEnqueueRender(
  formData: FormData,
  status: RenderableContentStatus,
) {
  const contentItemId = getRequiredFormValue(formData, "contentItemId");

  try {
    await enqueueContentItemRender({
      contentItemId,
      status,
    });
  } catch (error) {
    redirect(
      `/content?error=${encodeURIComponent(toActionErrorMessage(error))}` as Route,
    );
  }

  revalidatePath("/content");
  redirect(`/content?${status}=1` as Route);
}

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing ${key}.`);
  }

  return value.trim();
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function toActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 180);
  }

  return "Content action failed.";
}
