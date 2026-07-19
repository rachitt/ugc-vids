import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";

const DEFAULT_WORKSPACE_NAME = "Default Workspace";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getOrCreateDefaultWorkspace() {
  const [existingWorkspace] = await db
    .select({
      id: workspaces.id,
    })
    .from(workspaces)
    .where(eq(workspaces.name, DEFAULT_WORKSPACE_NAME))
    .limit(1);

  if (existingWorkspace) {
    return existingWorkspace;
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: DEFAULT_WORKSPACE_NAME,
    })
    .returning({
      id: workspaces.id,
    });

  if (!workspace) {
    throw new Error("The default workspace could not be created.");
  }

  return workspace;
}

export function isWorkspaceId(value: string) {
  return uuidPattern.test(value);
}

export async function isUserWorkspaceMember({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  if (!isWorkspaceId(workspaceId)) {
    return false;
  }

  const [membership] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  return Boolean(membership);
}
