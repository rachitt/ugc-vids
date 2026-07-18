"use server";

import { revalidatePath } from "next/cache";

import { InsufficientCreditsError } from "@/lib/credits";
import {
  createCustomAvatar,
  CustomAvatarValidationError,
} from "@/lib/avatars";

import { isUuid } from "../workspace";

export type CreateAvatarActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  avatarId?: string;
  balanceAfter?: number;
};

function formString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function createAvatarAction(
  _previousState: CreateAvatarActionState,
  formData: FormData,
): Promise<CreateAvatarActionState> {
  const workspaceId = formString(formData, "workspaceId").trim();

  if (!isUuid(workspaceId)) {
    return {
      status: "error",
      message: "Select a workspace before creating a custom avatar.",
    };
  }

  try {
    const result = await createCustomAvatar({
      workspaceId,
      name: formString(formData, "name"),
      lookPrompt: formString(formData, "lookPrompt"),
      vibeTone: formString(formData, "vibeTone"),
    });

    revalidatePath("/studio");
    revalidatePath("/studio/new");

    return {
      status: "success",
      message: `${result.avatar.name} created. ${result.creditsDebited} credits debited.`,
      avatarId: result.avatar.id,
      balanceAfter: result.balanceAfter,
    };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return {
        status: "error",
        message: `Insufficient credits: ${error.availableCredits} available, ${error.requiredCredits} required.`,
      };
    }

    if (error instanceof CustomAvatarValidationError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }
}
