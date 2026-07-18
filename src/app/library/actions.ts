"use server";

import { revalidatePath } from "next/cache";

import {
  recordMoreLikeThisSignal,
  rejectContentItem,
  unsaveContentItem,
} from "@/lib/content/mutations";
import type { ContentActionResult } from "@/lib/content/types";

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
