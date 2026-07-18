"use server";

import { revalidatePath } from "next/cache";

import {
  rejectContentItem,
  requestMoreGeneratedContent,
  saveContentItem,
} from "@/lib/content/mutations";
import { getActiveWorkspace } from "@/lib/content/queries";
import type { ContentActionResult } from "@/lib/content/types";

export async function saveBlitzItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const result = await saveContentItem(contentItemId);

  revalidatePath("/blitz");
  revalidatePath("/library");

  return result;
}

export async function rejectBlitzItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const result = await rejectContentItem(contentItemId);

  revalidatePath("/blitz");
  revalidatePath("/library");

  return result;
}

export async function requestMoreBlitzItems(): Promise<ContentActionResult> {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return {
      ok: false,
      error: "Create or seed a workspace before requesting more content.",
    };
  }

  const result = await requestMoreGeneratedContent(workspace.id);

  revalidatePath("/blitz");

  return {
    ok: true,
    message: result.message,
  };
}
