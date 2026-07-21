import { AppHeaderNavClient } from "@/components/app-header-nav-client";
import {
  getActiveWorkspaceContext,
  setActiveWorkspaceAction,
} from "@/lib/workspaces";

export async function AppHeaderNav() {
  const context = await getActiveWorkspaceContext();

  return (
    <AppHeaderNavClient
      activeWorkspaceId={context.workspace.id}
      setActiveWorkspaceAction={setActiveWorkspaceAction}
      workspaces={context.workspaces}
    />
  );
}
