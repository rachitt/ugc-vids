import type { contentItems, workspaces } from "@/lib/db/schema";
import type { ContentFormat } from "./formats";

export type { ContentFormat } from "./formats";

export type WorkspacePlan = typeof workspaces.$inferSelect.plan;
export type ContentStatus = typeof contentItems.$inferSelect.status;
export type ContentScriptBase = typeof contentItems.$inferSelect.script;

export type MoreLikeThisSignal = {
  count: number;
  lastSignaledAt: string;
  signals: Array<{
    action: "more_like_this";
    at: string;
    source: "library";
  }>;
};

export type ContentScript = ContentScriptBase & {
  preferenceSignals?: {
    moreLikeThis?: MoreLikeThisSignal;
  };
};

export type ContentItemSummary = {
  id: string;
  workspaceId: string;
  format: ContentFormat;
  status: ContentStatus;
  renderStatus: typeof contentItems.$inferSelect.renderStatus;
  script: ContentScript;
  thumbUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  plan: WorkspacePlan;
};

export type SaveLimit = {
  plan: WorkspacePlan;
  cap: number | null;
  savedCount: number;
  remaining: number | null;
};

export type ContentActionResult =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      error: string;
    };
