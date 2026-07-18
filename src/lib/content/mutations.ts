import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { contentItems, subscriptions } from "@/lib/db/schema";

import {
  placeholderGenerationRequester,
  type GenerationRequestResult,
} from "./generation-contract";
import { countGeneratedContentItems, getPlanSaveCap } from "./queries";
import type {
  ContentActionResult,
  ContentScript,
  MoreLikeThisSignal,
} from "./types";

export async function saveContentItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: contentItems.id,
        status: contentItems.status,
        workspaceId: contentItems.workspaceId,
      })
      .from(contentItems)
      .where(eq(contentItems.id, contentItemId))
      .limit(1);

    if (!item) {
      return { ok: false, error: "Content item not found." };
    }

    if (item.status === "saved") {
      return { ok: true, message: "Already saved." };
    }

    await tx.execute(
      sql`select id from workspaces where id = ${item.workspaceId} for update`,
    );

    const [subscription] = await tx
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, item.workspaceId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    const plan = subscription?.plan ?? "free";
    const cap = getPlanSaveCap(plan);

    if (cap !== null) {
      const [saved] = await tx
        .select({ value: count() })
        .from(contentItems)
        .where(
          and(
            eq(contentItems.workspaceId, item.workspaceId),
            eq(contentItems.status, "saved"),
          ),
        );
      const savedCount = saved?.value ?? 0;

      if (savedCount >= cap) {
        return {
          ok: false,
          error: `Save limit reached for the ${plan} plan (${cap} items).`,
        };
      }
    }

    await tx
      .update(contentItems)
      .set({ status: "saved", updatedAt: new Date() })
      .where(eq(contentItems.id, contentItemId));

    return { ok: true, message: "Saved to library." };
  });
}

export async function rejectContentItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const [item] = await db
    .update(contentItems)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId))
    .returning({ id: contentItems.id });

  if (!item) {
    return { ok: false, error: "Content item not found." };
  }

  return { ok: true, message: "Rejected." };
}

export async function unsaveContentItem(
  contentItemId: string,
): Promise<ContentActionResult> {
  const [item] = await db
    .update(contentItems)
    .set({ status: "generated", updatedAt: new Date() })
    .where(eq(contentItems.id, contentItemId))
    .returning({ id: contentItems.id });

  if (!item) {
    return { ok: false, error: "Content item not found." };
  }

  return { ok: true, message: "Moved back to Blitz." };
}

export async function recordMoreLikeThisSignal(
  contentItemId: string,
): Promise<ContentActionResult> {
  const [item] = await db
    .select({
      id: contentItems.id,
      script: contentItems.script,
      status: contentItems.status,
    })
    .from(contentItems)
    .where(eq(contentItems.id, contentItemId))
    .limit(1);

  if (!item) {
    return { ok: false, error: "Content item not found." };
  }

  if (item.status !== "saved") {
    return {
      ok: false,
      error: "Preference signals can only be recorded for saved items.",
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const script = item.script as ContentScript;
  const current = script.preferenceSignals?.moreLikeThis;
  const signal: MoreLikeThisSignal = {
    count: (current?.count ?? 0) + 1,
    lastSignaledAt: nowIso,
    signals: [
      ...(current?.signals ?? []),
      {
        action: "more_like_this" as const,
        at: nowIso,
        source: "library" as const,
      },
    ].slice(-25),
  };
  const nextScript: ContentScript = {
    ...script,
    preferenceSignals: {
      ...script.preferenceSignals,
      moreLikeThis: signal,
    },
  };

  await db
    .update(contentItems)
    .set({ script: nextScript, updatedAt: now })
    .where(eq(contentItems.id, contentItemId));

  return { ok: true, message: "Preference signal recorded." };
}

export async function requestMoreGeneratedContent(
  workspaceId: string,
): Promise<GenerationRequestResult> {
  const currentGeneratedCount = await countGeneratedContentItems(workspaceId);

  return placeholderGenerationRequester.requestGeneration({
    workspaceId,
    reason: "deck_low",
    targetCount: Math.max(12, 20 - currentGeneratedCount),
  });
}
