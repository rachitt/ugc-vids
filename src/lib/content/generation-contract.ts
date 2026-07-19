import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { brandProfiles, contentItems } from "@/lib/db/schema";
import {
  parsePromptRecipe,
  type PromptRecipe,
} from "@/lib/trends/metadata";

import { generateMixedContentBatch } from "./batch";
import {
  clampBatchSize,
  contentFormatLabels,
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
  variantOfContentItemId?: string;
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

type VariantSourceItem = Pick<
  typeof contentItems.$inferSelect,
  "format" | "id" | "script" | "trendTemplateId"
>;

type PreparedGenerationRequest = {
  formats?: RenderableContentFormat[];
  promptRecipe?: PromptRecipe;
  totalCount?: number;
  trendTemplateId?: string | null;
  variantOfContentItemId?: string;
};

async function prepareGenerationRequest(
  request: GenerationRequest,
): Promise<PreparedGenerationRequest> {
  if (!request.variantOfContentItemId) {
    return {
      formats: formatPlanForRequest(request),
      promptRecipe: promptRecipeForRequest(request),
      totalCount: totalCountForRequest(request),
      trendTemplateId: request.trendTemplateId,
    };
  }

  const [sourceItem] = await db
    .select({
      format: contentItems.format,
      id: contentItems.id,
      script: contentItems.script,
      trendTemplateId: contentItems.trendTemplateId,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.id, request.variantOfContentItemId),
        eq(contentItems.workspaceId, request.workspaceId),
      ),
    )
    .limit(1);

  if (!sourceItem) {
    throw new Error("Variant source content item was not found.");
  }

  if (!isRenderableContentFormat(sourceItem.format)) {
    throw new Error("Variant source format is not renderable.");
  }

  const sourceFormat: RenderableContentFormat = sourceItem.format;
  const count = clampBatchSize(totalCountForRequest(request) ?? 1);

  return {
    formats: Array.from({ length: count }, () => sourceFormat),
    promptRecipe: promptRecipeForVariantSource(sourceItem),
    totalCount: count,
    trendTemplateId: sourceItem.trendTemplateId,
    variantOfContentItemId: sourceItem.id,
  };
}

function promptRecipeForVariantSource(
  sourceItem: VariantSourceItem,
): PromptRecipe {
  const sourceHook = limitRecipeText(readSourceScriptText(sourceItem, "hook"));
  const sourceCaption = limitRecipeText(
    readSourceScriptText(sourceItem, "caption"),
  );
  const sourceBeats = readSourceScriptBeats(sourceItem).map(limitRecipeText);
  const formatLabel = contentFormatLabels[sourceItem.format];

  return {
    avoid: [
      "copying the source hook verbatim",
      "reusing the exact source slide or line wording",
      "changing the core topic or audience",
    ],
    beats: [
      `Source hook: ${sourceHook}`,
      `Source caption: ${sourceCaption}`,
      ...sourceBeats.map((beat) => `Source beat: ${beat}`),
    ],
    cta: "Keep the call to action aligned with the source, but write it freshly.",
    generationNotes: [
      "VARIANT REQUEST: produce a fresh variant of the source content item.",
      `Keep the same format: ${formatLabel}.`,
      "Keep the same core angle/topic and audience intent.",
      "Use different hook phrasing and different slides or lines.",
      `Source hook: ${sourceHook}`,
      `Source caption: ${sourceCaption}`,
    ].join(" "),
    hook: `Variant of: ${sourceHook}`,
    setup:
      "Use the source winner as the strategic reference, not as copy to paraphrase line by line.",
    visualPlan: [
      `Use the ${formatLabel} structure.`,
      "Open with a fresh first-frame hook.",
      "Change the middle beats while preserving the winning angle.",
      "End with a caption and CTA that feel related but new.",
    ],
  };
}

function readSourceScriptText(
  sourceItem: VariantSourceItem,
  key: "caption" | "hook",
) {
  const value = sourceItem.script?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "No source text provided";
}

function readSourceScriptBeats(sourceItem: VariantSourceItem) {
  const slides = Array.isArray(sourceItem.script?.slides)
    ? sourceItem.script.slides
    : [];
  const lines = Array.isArray(sourceItem.script?.lines)
    ? sourceItem.script.lines
    : [];

  return [...slides, ...lines].filter(
    (beat): beat is string => typeof beat === "string" && beat.trim().length > 0,
  );
}

function limitRecipeText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > 240
    ? `${normalized.slice(0, 237).trimEnd()}...`
    : normalized;
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
      const preparedRequest = await prepareGenerationRequest(request);

      const result = await generateMixedContentBatch({
        brandProfileId: brandProfile.id,
        formats: preparedRequest.formats,
        promptRecipe: preparedRequest.promptRecipe,
        totalCount: preparedRequest.totalCount,
        trendTemplateId: preparedRequest.trendTemplateId,
        variantOfContentItemId: preparedRequest.variantOfContentItemId,
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
