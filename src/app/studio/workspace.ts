import {
  getActiveWorkspaceContext,
  getWorkspaceById,
  type WorkspaceSummary,
} from "@/lib/workspaces";

export type StudioSearchParams = Record<string, string | string[] | undefined>;

export type StudioWorkspace = WorkspaceSummary;

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
    const workspace = await getWorkspaceById(requestedWorkspaceId);

    if (workspace) {
      return workspace;
    }
  }

  const { workspace } = await getActiveWorkspaceContext();

  return workspace;
}

export function workspaceQuerySuffix(workspace: StudioWorkspace | null) {
  return workspace ? `?workspaceId=${workspace.id}` : "";
}
