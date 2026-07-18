import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

export type StudioSearchParams = Record<string, string | string[] | undefined>;

export type StudioWorkspace = {
  id: string;
  name: string;
  plan: "free" | "starter" | "growth" | "pro";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export async function resolveStudioWorkspace(
  searchParams: StudioSearchParams,
): Promise<StudioWorkspace | null> {
  const requestedWorkspaceId = firstSearchParam(searchParams.workspaceId);

  if (isUuid(requestedWorkspaceId)) {
    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        plan: workspaces.plan,
      })
      .from(workspaces)
      .where(eq(workspaces.id, requestedWorkspaceId))
      .limit(1);

    if (workspace) {
      return workspace;
    }
  }

  const [latestWorkspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      plan: workspaces.plan,
    })
    .from(workspaces)
    .orderBy(desc(workspaces.createdAt))
    .limit(1);

  return latestWorkspace ?? null;
}

export function workspaceQuerySuffix(workspace: StudioWorkspace | null) {
  return workspace ? `?workspaceId=${workspace.id}` : "";
}
