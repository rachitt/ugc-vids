"use server";

import { revalidatePath } from "next/cache";

import {
  rejectContentItem,
  requestMoreGeneratedContent,
  saveContentItem,
} from "@/lib/content/mutations";
import type { ContentActionResult } from "@/lib/content/types";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

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
  const { workspace } = await getActiveWorkspaceContext();

  const result = await requestMoreGeneratedContent(workspace.id);

  revalidatePath("/blitz");

  if (!result.accepted) {
    return {
      ok: false,
      error: result.message,
    };
  }

  return {
    ok: true,
    message: result.message,
  };
}
