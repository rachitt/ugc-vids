import { count, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { brandProfiles, contentItems, workspaces } from "@/lib/db/schema";

const DEFAULT_WORKSPACE_NAME = "Default Workspace";
const ACTIVE_WORKSPACE_COOKIE = "fastlane_workspace_id";
const ACTIVE_WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const workspaceIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WorkspaceSummary = Pick<
  typeof workspaces.$inferSelect,
  "id" | "name" | "plan"
>;

export type WorkspaceSwitcherOption = WorkspaceSummary & {
  brandProfileCount: number;
  contentItemCount: number;
};

export type ActiveWorkspaceContext = {
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSwitcherOption[];
  source: "brand_profile" | "cookie" | "default";
};

export type SetActiveWorkspaceResult =
  | {
      ok: true;
      workspaceId: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function getOrCreateDefaultWorkspace(): Promise<WorkspaceSummary> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${DEFAULT_WORKSPACE_NAME}))`,
    );

    const [existingWorkspace] = await tx
      .select({
        id: workspaces.id,
        name: workspaces.name,
        plan: workspaces.plan,
      })
      .from(workspaces)
      .where(eq(workspaces.name, DEFAULT_WORKSPACE_NAME))
      .limit(1);

    if (existingWorkspace) {
      return existingWorkspace;
    }

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: DEFAULT_WORKSPACE_NAME,
      })
      .returning({
        id: workspaces.id,
        name: workspaces.name,
        plan: workspaces.plan,
      });

    if (!workspace) {
      throw new Error("The default workspace could not be created.");
    }

    return workspace;
  });
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<WorkspaceSummary | null> {
  if (!isWorkspaceId(workspaceId)) {
    return null;
  }

  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      plan: workspaces.plan,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return workspace ?? null;
}

export async function getActiveWorkspaceContext(): Promise<ActiveWorkspaceContext> {
  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const cookieWorkspace = cookieWorkspaceId
    ? await getWorkspaceById(cookieWorkspaceId)
    : null;

  let source: ActiveWorkspaceContext["source"] = "cookie";
  let workspace = cookieWorkspace;

  if (!workspace) {
    workspace = await getMostRecentlyUpdatedBrandProfileWorkspace();
    source = workspace ? "brand_profile" : "default";
  }

  if (!workspace) {
    workspace = await getOrCreateDefaultWorkspace();
  }

  const workspaceOptions = await listWorkspaceSwitcherOptions();

  return {
    workspace,
    workspaces: workspaceOptions.some((option) => option.id === workspace.id)
      ? workspaceOptions
      : [toWorkspaceSwitcherOption(workspace), ...workspaceOptions],
    source,
  };
}

export async function setActiveWorkspaceAction(
  workspaceId: string,
): Promise<SetActiveWorkspaceResult> {
  "use server";

  const workspace = await getWorkspaceById(workspaceId.trim());

  if (!workspace) {
    return {
      ok: false,
      error: "Workspace not found.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    httpOnly: false,
    maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  revalidateActiveWorkspacePaths();

  return {
    ok: true,
    workspaceId: workspace.id,
  };
}

async function getMostRecentlyUpdatedBrandProfileWorkspace(): Promise<WorkspaceSummary | null> {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      plan: workspaces.plan,
    })
    .from(brandProfiles)
    .innerJoin(workspaces, eq(brandProfiles.workspaceId, workspaces.id))
    .orderBy(desc(brandProfiles.updatedAt), desc(brandProfiles.createdAt))
    .limit(1);

  return workspace ?? null;
}

async function listWorkspaceSwitcherOptions(): Promise<
  WorkspaceSwitcherOption[]
> {
  const [workspaceRows, brandProfileCountRows, contentItemCountRows] =
    await Promise.all([
      db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          plan: workspaces.plan,
        })
        .from(workspaces)
        .orderBy(desc(workspaces.updatedAt), desc(workspaces.createdAt)),
      db
        .select({
          count: count(),
          workspaceId: brandProfiles.workspaceId,
        })
        .from(brandProfiles)
        .groupBy(brandProfiles.workspaceId),
      db
        .select({
          count: count(),
          workspaceId: contentItems.workspaceId,
        })
        .from(contentItems)
        .groupBy(contentItems.workspaceId),
    ]);
  const brandProfileCounts = new Map(
    brandProfileCountRows.map((row) => [row.workspaceId, row.count]),
  );
  const contentItemCounts = new Map(
    contentItemCountRows.map((row) => [row.workspaceId, row.count]),
  );

  return workspaceRows.map((workspace) => ({
    ...workspace,
    brandProfileCount: brandProfileCounts.get(workspace.id) ?? 0,
    contentItemCount: contentItemCounts.get(workspace.id) ?? 0,
  }));
}

function toWorkspaceSwitcherOption(
  workspace: WorkspaceSummary,
): WorkspaceSwitcherOption {
  return {
    ...workspace,
    brandProfileCount: 0,
    contentItemCount: 0,
  };
}

function isWorkspaceId(value: string) {
  return workspaceIdPattern.test(value);
}

function revalidateActiveWorkspacePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/blitz");
  revalidatePath("/calendar");
  revalidatePath("/content");
  revalidatePath("/library");
  revalidatePath("/studio");
  revalidatePath("/studio/clips");
  revalidatePath("/studio/new");
  revalidatePath("/trending");
}
