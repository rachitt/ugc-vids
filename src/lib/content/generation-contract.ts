import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { parsePromptRecipe } from "@/lib/trends/metadata";

import { generateMixedContentBatch } from "./batch";
import {
  clampBatchSize,
  isRenderableContentFormat,
  type ContentFormat,
  type RenderableContentFormat,
} from "./formats";

export type GenerationRequestReason =
  "deck_low" | "manual_request" | "preference_refresh";
export type GenerationRequestSource =
  "blitz_deck" | "manual" | "trending_remix";

export type GenerationRequest = {
  workspaceId: string;
  reason: GenerationRequestReason;
  source?: GenerationRequestSource;
  requestedFormats?: ContentFormat[];
  targetCount?: number;
  sourceContentItemId?: string;
  trendTemplateId?: string;
  promptRecipe?: string;
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

function requestedFormatsForRequest(
  request: GenerationRequest,
): RenderableContentFormat[] {
  const requestedFormats = request.requestedFormats?.filter(
    isRenderableContentFormat,
  );

  return requestedFormats ?? [];
}

function totalCountForRequest(request: GenerationRequest) {
  if (typeof request.targetCount === "number") {
    return request.targetCount;
  }

  const requestedFormats = requestedFormatsForRequest(request);

  return requestedFormats.length > 0 ? requestedFormats.length : undefined;
}

function formatPlanForRequest(
  request: GenerationRequest,
): RenderableContentFormat[] | undefined {
  const requestedFormats = requestedFormatsForRequest(request);

  if (requestedFormats.length === 0) {
    return undefined;
  }

  const count = clampBatchSize(
    totalCountForRequest(request) ?? requestedFormats.length,
  );

  return Array.from(
    { length: count },
    (_, index) => requestedFormats[index % requestedFormats.length],
  );
}

function promptRecipeForRequest(request: GenerationRequest) {
  if (!request.promptRecipe) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(request.promptRecipe);
    const promptRecipe = parsePromptRecipe(parsed);

    if (promptRecipe) {
      return promptRecipe;
    }
  } catch {
    // Fall through to the shared validation error below.
  }

  throw new Error("Prompt recipe must be valid JSON with the required fields.");
}

function validateGenerationRequest(request: GenerationRequest) {
  if (request.source !== "trending_remix") {
    return;
  }

  if (!request.trendTemplateId) {
    throw new Error("Trend remix generation requires a trend template id.");
  }

  if (requestedFormatsForRequest(request).length === 0) {
    throw new Error("Trend remix generation requires a renderable format.");
  }
}

export const batchGenerationRequester: GenerationRequester = {
  async requestGeneration(request) {
    const requestId = createRequestId(request.workspaceId);
    const [brandProfile] = await db
      .select({
        id: brandProfiles.id,
      })
      .from(brandProfiles)
      .where(eq(brandProfiles.workspaceId, request.workspaceId))
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
      validateGenerationRequest(request);

      const result = await generateMixedContentBatch({
        brandProfileId: brandProfile.id,
        formats: formatPlanForRequest(request),
        promptRecipe: promptRecipeForRequest(request),
        totalCount: totalCountForRequest(request),
        trendTemplateId: request.trendTemplateId,
        workspaceId: request.workspaceId,
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
