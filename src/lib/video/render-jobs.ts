import {
  normalizeCompositionId,
  type RemotionCompositionId,
  type RemotionProps,
  validateRemotionProps,
} from "./remotion-props";

export type NormalizedRenderJob = {
  contentItemId: string;
  compositionId: RemotionCompositionId;
  props: RemotionProps;
  serveUrl?: string;
  workspaceId: string;
};

type RenderJobLike = {
  contentItemId?: unknown;
  compositionId?: unknown;
  props?: unknown;
  serveUrl?: unknown;
  workspaceId?: unknown;
};

export function normalizeRenderJobData(input: unknown): NormalizedRenderJob {
  const job = input as RenderJobLike;

  if (typeof job.contentItemId !== "string" || job.contentItemId.length === 0) {
    throw new Error("Render job is missing contentItemId.");
  }

  const props = validateRemotionProps(job.props);
  const compositionId = normalizeCompositionId(
    typeof job.compositionId === "string" ? job.compositionId : undefined,
    props.format,
  );

  return {
    compositionId,
    contentItemId: job.contentItemId,
    props,
    serveUrl: typeof job.serveUrl === "string" ? job.serveUrl : undefined,
    workspaceId:
      typeof job.workspaceId === "string" && job.workspaceId.length > 0
        ? job.workspaceId
        : "unknown",
  };
}
