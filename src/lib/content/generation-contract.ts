import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

import { generateMixedContentBatch } from "./batch";
import { isRenderableContentFormat, type ContentFormat } from "./formats";

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
  status: "blocked" | "failed" | "generated";
  message: string;
  requestId: string;
  brandProfileId?: string;
  failedCount?: number;
  generatedCount?: number;
  requestedCount?: number;
};

export interface GenerationRequester {
  requestGeneration(
    request: GenerationRequest,
  ): Promise<GenerationRequestResult>;
}

function createRequestId(workspaceId: string) {
  return `generation-${workspaceId}-${Date.now()}`;
}

function totalCountForRequest(request: GenerationRequest) {
  if (typeof request.targetCount === "number") {
    return request.targetCount;
  }

  const requestedFormats = request.requestedFormats?.filter(
    isRenderableContentFormat,
  );

  return requestedFormats && requestedFormats.length > 0
    ? requestedFormats.length
    : undefined;
}

export const placeholderGenerationRequester: GenerationRequester = {
  async requestGeneration(request) {
    const { workspace } = await getActiveWorkspaceContext();
    const requestId = createRequestId(workspace.id);
    const [brandProfile] = await db
      .select({
        id: brandProfiles.id,
      })
      .from(brandProfiles)
      .where(eq(brandProfiles.workspaceId, workspace.id))
      .orderBy(desc(brandProfiles.updatedAt), desc(brandProfiles.createdAt))
      .limit(1);

    if (!brandProfile) {
      return {
        accepted: false,
        status: "blocked",
        message: "No brand profile yet - create one first.",
        requestId,
      };
    }

    try {
      const result = await generateMixedContentBatch({
        brandProfileId: brandProfile.id,
        totalCount: totalCountForRequest(request),
        workspaceId: workspace.id,
      });

      return {
        accepted: result.generatedCount > 0,
        status: result.generatedCount > 0 ? "generated" : "failed",
        message: `Generated ${result.generatedCount} item(s); ${result.failedCount} failed.`,
        requestId,
        brandProfileId: brandProfile.id,
        failedCount: result.failedCount,
        generatedCount: result.generatedCount,
        requestedCount: result.requestedCount,
      };
    } catch (error) {
      return {
        accepted: false,
        status: "failed",
        message: toErrorMessage(error),
        requestId,
        brandProfileId: brandProfile.id,
      };
    }
  },
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Content generation failed.";
}
