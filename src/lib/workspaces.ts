import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

const DEFAULT_WORKSPACE_NAME = "Default Workspace";

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
