import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { contentItems, workspaces } from "@/lib/db/schema";
import type { PromptRecipe } from "@/lib/trends/metadata";
import { createFallbackPromptRecipe } from "@/lib/trends/metadata";
import type { TrendTemplateView } from "@/lib/trends/queries";
import {
  formatForCompositionId,
  validateRemotionProps,
  type ContentFormat,
  type RemotionProps,
} from "@/lib/video/remotion-props";
import { remotionFixtures } from "@/remotion/fixtures";

export type GenerationRequest = {
  brand?: RemotionProps["brand"];
  brandProfileId?: string | null;
  promptRecipe?: PromptRecipe;
  source: "trending_remix";
  trendTemplate: TrendTemplateView;
  workspaceId: string;
};

export type GenerationResult = {
  contentItemId: string;
  format: ContentFormat;
  remotionProps: RemotionProps;
};

export interface GenerationRequester {
  requestGeneration(request: GenerationRequest): Promise<GenerationResult>;
}

function cloneRemotionProps(props: RemotionProps): RemotionProps {
  return JSON.parse(JSON.stringify(props)) as RemotionProps;
}

function firstFixturePropsForFormat(format: ContentFormat): RemotionProps {
  const fixture = remotionFixtures.find(
    (candidate) => candidate.format === format,
  );

  if (!fixture) {
    throw new Error(`No Remotion fixture registered for ${format}.`);
  }

  return cloneRemotionProps(fixture.props);
}

function hashtagForTag(tag: string): string {
  const compact = tag.replace(/[^a-z0-9]/gi, "").toLowerCase();

  return compact ? `#${compact}` : "";
}

function deriveHashtags(tags: string[]): string[] {
  return tags.map(hashtagForTag).filter(Boolean).slice(0, 8);
}

function recipeForRequest(request: GenerationRequest): PromptRecipe {
  return (
    request.promptRecipe ??
    request.trendTemplate.metadata?.promptRecipe ??
    createFallbackPromptRecipe(
      request.trendTemplate.title,
      request.trendTemplate.structureDescription,
    )
  );
}

function beatsForRecipe(promptRecipe: PromptRecipe): string[] {
  return promptRecipe.beats.length ? promptRecipe.beats : [promptRecipe.setup];
}

function visualPlanForRecipe(promptRecipe: PromptRecipe): string[] {
  return promptRecipe.visualPlan.length
    ? promptRecipe.visualPlan
    : [promptRecipe.setup];
}

function buildRemotionPropsForRequest(
  request: GenerationRequest,
  format: ContentFormat,
): RemotionProps {
  const props = firstFixturePropsForFormat(format);
  const promptRecipe = recipeForRequest(request);
  const caption =
    request.trendTemplate.engagementNotes || promptRecipe.generationNotes;
  const beats = beatsForRecipe(promptRecipe);
  const visualPlan = visualPlanForRecipe(promptRecipe);

  const baseProps: RemotionProps = {
    ...props,
    brand: request.brand ?? props.brand,
    caption,
    hashtags: deriveHashtags(request.trendTemplate.nicheTags),
    title: request.trendTemplate.title,
  };

  switch (format) {
    case "slideshow": {
      const fixtureSlides = props.slideshow?.slides ?? [];
      const slides = fixtureSlides.map((slide, index) => ({
        ...slide,
        caption: beats[index] ?? slide.caption,
        eyebrow:
          request.trendTemplate.nicheTags[index] ??
          slide.eyebrow ??
          `Beat ${index + 1}`,
      }));

      return validateRemotionProps({
        ...baseProps,
        slideshow: {
          kicker: promptRecipe.hook,
          slides,
        },
      });
    }
    case "wall_of_text":
      return validateRemotionProps({
        ...baseProps,
        wallOfText: {
          ...props.wallOfText,
          body: beats.join("\n"),
          headline: promptRecipe.hook,
          sourceLabel: promptRecipe.proofCue ?? props.wallOfText?.sourceLabel,
        },
      });
    case "greenscreen_meme":
      return validateRemotionProps({
        ...baseProps,
        greenscreenMeme: {
          ...props.greenscreenMeme,
          caption: promptRecipe.hook,
          reactionLabel:
            promptRecipe.proofCue ?? props.greenscreenMeme?.reactionLabel,
        },
      });
    case "hook_demo": {
      const fixtureShots = props.hookDemo?.shots ?? [];
      const shots = fixtureShots.map((shot, index) => ({
        ...shot,
        caption: beats[index] ?? shot.caption,
        label: visualPlan[index] ?? shot.label,
      }));

      return validateRemotionProps({
        ...baseProps,
        hookDemo: {
          cta: promptRecipe.cta,
          hook: promptRecipe.hook,
          shots,
          subhook: promptRecipe.setup,
        },
      });
    }
  }
}

function buildScript(promptRecipe: PromptRecipe, remotionProps: RemotionProps) {
  return {
    caption: remotionProps.caption,
    hashtags: remotionProps.hashtags,
    hook: promptRecipe.hook,
    lines: beatsForRecipe(promptRecipe),
    slides: visualPlanForRecipe(promptRecipe),
  };
}

export class StubGenerationRequester implements GenerationRequester {
  async requestGeneration(
    request: GenerationRequest,
  ): Promise<GenerationResult> {
    const format = formatForCompositionId(
      request.trendTemplate.remotionTemplateId,
    );

    if (!format) {
      throw new Error(
        `Cannot remix trend with unknown Remotion template "${request.trendTemplate.remotionTemplateId}".`,
      );
    }

    const promptRecipe = recipeForRequest(request);
    const remotionProps = buildRemotionPropsForRequest(request, format);
    const [contentItem] = await db
      .insert(contentItems)
      .values({
        brandProfileId: request.brandProfileId ?? null,
        format,
        remotionProps,
        script: buildScript(promptRecipe, remotionProps),
        status: "generated",
        trendTemplateId: request.trendTemplate.id,
        workspaceId: request.workspaceId,
      })
      .returning({
        id: contentItems.id,
      });

    if (!contentItem) {
      throw new Error("Generation requester did not create a content item.");
    }

    return {
      contentItemId: contentItem.id,
      format,
      remotionProps,
    };
  }
}

export const stubGenerationRequester: GenerationRequester =
  new StubGenerationRequester();

export async function getDefaultGenerationWorkspaceId(): Promise<
  string | null
> {
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .orderBy(asc(workspaces.createdAt))
    .limit(1);

  return workspace?.id ?? null;
}
