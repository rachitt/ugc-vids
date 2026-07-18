import type { ContentFormat } from "./types";

export type GenerationRequestReason =
  "deck_low" | "manual_request" | "preference_refresh";

export type GenerationRequest = {
  workspaceId: string;
  reason: GenerationRequestReason;
  requestedFormats?: ContentFormat[];
  targetCount?: number;
  sourceContentItemId?: string;
};

export type GenerationRequestResult = {
  accepted: boolean;
  status: "stubbed";
  message: string;
  requestId: string;
};

/**
 * Contract for the future content generation pipeline.
 *
 * Phase 3 only needs a stable integration point. The real pipeline should
 * implement this interface and create new content_items rows asynchronously.
 */
export interface GenerationRequester {
  requestGeneration(
    request: GenerationRequest,
  ): Promise<GenerationRequestResult>;
}

export const placeholderGenerationRequester: GenerationRequester = {
  async requestGeneration(request) {
    return {
      accepted: false,
      status: "stubbed",
      message:
        "Generation request captured by the Phase 3 stub. The real pipeline will enqueue more content_items here.",
      requestId: `stub-${request.workspaceId}-${Date.now()}`,
    };
  },
};
