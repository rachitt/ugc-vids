import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { contentItems, subscriptions } from "@/lib/db/schema";

import type {
  ContentItemSummary,
  ContentScript,
  SaveLimit,
  WorkspacePlan,
} from "./types";

const DEFAULT_DECK_LIMIT = 30;

function toContentItemSummary(
  item: typeof contentItems.$inferSelect,
): ContentItemSummary {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    format: item.format,
    status: item.status,
    script: item.script as ContentScript,
    thumbUrl: item.thumbUrl,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function getPlanSaveCap(plan: WorkspacePlan) {
  if (plan === "growth") {
    return 100;
  }

  if (plan === "pro") {
    return null;
  }

  return 20;
}

export async function getWorkspacePlan(
  workspaceId: string,
): Promise<WorkspacePlan> {
  const [subscription] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return subscription?.plan ?? "free";
}

export async function getWorkspaceSaveLimit(
  workspaceId: string,
): Promise<SaveLimit> {
  const [saved] = await db
    .select({ value: count() })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.status, "saved"),
      ),
    );
  const plan = await getWorkspacePlan(workspaceId);
  const cap = getPlanSaveCap(plan);
  const savedCount = saved?.value ?? 0;

  return {
    plan,
    cap,
    savedCount,
    remaining: cap === null ? null : Math.max(cap - savedCount, 0),
  };
}

export async function listGeneratedContentItems(
  workspaceId: string,
  limit = DEFAULT_DECK_LIMIT,
) {
  const items = await db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.status, "generated"),
      ),
    )
    .orderBy(desc(contentItems.createdAt))
    .limit(limit);

  return items.map(toContentItemSummary);
}

export async function listSavedContentItems(workspaceId: string) {
  const items = await db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.status, "saved"),
      ),
    )
    .orderBy(desc(contentItems.updatedAt), desc(contentItems.createdAt));

  return items.map(toContentItemSummary);
}

export async function countGeneratedContentItems(workspaceId: string) {
  const [generated] = await db
    .select({ value: count() })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.status, "generated"),
      ),
    );

  return generated?.value ?? 0;
}
