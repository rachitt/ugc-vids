"use server";

import { revalidatePath } from "next/cache";

import {
  recordMoreLikeThisSignal,
  rejectContentItem,
  unsaveContentItem,
} from "@/lib/content/mutations";
import type { ContentActionResult } from "@/lib/content/types";
import { enqueueContentItemRender } from "@/lib/jobs/render-enqueue";

export async function unsaveLibraryItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const result = await unsaveContentItem(contentItemId);

  revalidatePath("/blitz");
  revalidatePath("/library");

  return result;
}

export async function rejectLibraryItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const result = await rejectContentItem(contentItemId);

  revalidatePath("/blitz");
  revalidatePath("/library");

  return result;
}

export async function moreLikeThisLibraryItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const result = await recordMoreLikeThisSignal(contentItemId);

  revalidatePath("/library");

  return result;
}

export async function renderLibraryItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  try {
    await enqueueContentItemRender({
      contentItemId,
      status: "saved",
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Render could not be queued.",
    };
  }

  revalidatePath("/library");

  return { ok: true, message: "Render queued." };
}
