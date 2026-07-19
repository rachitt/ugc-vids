"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import {
  batchGenerationRequester,
  type GenerationRequestSource,
} from "@/lib/content/generation-contract";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { isUserWorkspaceMember } from "@/lib/workspaces";

export type VariantRequestSource = Extract<
  GenerationRequestSource,
  "blitz_deck" | "manual"
>;

export type RequestContentVariantsInput = {
  contentItemId: string;
  count: number;
  source: VariantRequestSource;
};

export type RequestContentVariantsResult =
  | {
      ok: true;
      createdCount: number;
      message: string;
    }
  | {
      ok: false;
      createdCount: 0;
      error: string;
    };

export async function requestContentVariants({
  contentItemId,
  count,
  source,
}: RequestContentVariantsInput): Promise<RequestContentVariantsResult> {
  if (source !== "blitz_deck" && source !== "manual") {
    return {
      ok: false,
      createdCount: 0,
      error: "Unsupported variant source.",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      ok: false,
      createdCount: 0,
      error: "Sign in before requesting variants.",
    };
  }

  const [sourceItem] = await db
    .select({
      id: contentItems.id,
      workspaceId: contentItems.workspaceId,
    })
    .from(contentItems)
    .where(eq(contentItems.id, contentItemId))
    .limit(1);

  if (!sourceItem) {
    return {
      ok: false,
      createdCount: 0,
      error: "Content item not found.",
    };
  }

  const isMember = await isUserWorkspaceMember({
    userId: session.user.id,
    workspaceId: sourceItem.workspaceId,
  });

  if (!isMember) {
    return {
      ok: false,
      createdCount: 0,
      error: "You do not have access to this workspace.",
    };
  }

  const result = await batchGenerationRequester.requestGeneration({
    reason: "preference_refresh",
    source,
    targetCount: clampVariantCount(count),
    variantOfContentItemId: sourceItem.id,
    workspaceId: sourceItem.workspaceId,
  });

  revalidatePath("/analytics");
  revalidatePath("/blitz");
  revalidatePath("/content");
  revalidatePath("/library");

  if (!result.accepted) {
    return {
      ok: false,
      createdCount: 0,
      error: result.message,
    };
  }

  const createdCount = result.generatedCount ?? 0;

  return {
    ok: true,
    createdCount,
    message: `${createdCount} variants queued - review in Blitz.`,
  };
}

function clampVariantCount(count: number) {
  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(6, Math.max(1, Math.floor(count)));
}
