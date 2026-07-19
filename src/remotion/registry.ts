import type { ComponentType } from "react";
import type { CalculateMetadataFunction } from "remotion";

import type { RenderableContentFormat } from "../lib/content/formats";
import {
  compositionIdForFormat,
  DEFAULT_REMOTION_DURATION_IN_FRAMES,
  getRemotionDurationInFrames,
  REMOTION_FPS,
  REMOTION_VIDEO_HEIGHT,
  REMOTION_VIDEO_WIDTH,
  type RemotionCompositionId,
  type RemotionProps,
  validateRemotionProps,
} from "../lib/video/remotion-props";
import { GreenscreenMeme } from "./GreenscreenMeme";
import { HookDemo } from "./HookDemo";
import { PrimitivesDemo, type PrimitivesDemoProps } from "./PrimitivesDemo";
import { Slideshow } from "./Slideshow";
import { primitivesDemoFixture, remotionFixtures } from "./fixtures";
import { WallOfText } from "./WallOfText";

const defaultPropsByFormat = Object.fromEntries(
  remotionFixtures.map((fixture) => [fixture.format, fixture.props]),
) as Record<RenderableContentFormat, RemotionProps>;

const calculateMetadata: CalculateMetadataFunction<RemotionProps> = ({
  props,
}) => {
  const validatedProps = validateRemotionProps(props);

  return {
    durationInFrames: getRemotionDurationInFrames(validatedProps),
    fps: REMOTION_FPS,
    height: REMOTION_VIDEO_HEIGHT,
    props: validatedProps,
    width: REMOTION_VIDEO_WIDTH,
  };
};

export type RemotionCompositionDefinition = {
  id: RemotionCompositionId;
  format: RenderableContentFormat;
  label: string;
  component: ComponentType<RemotionProps>;
  defaultProps: RemotionProps;
  durationInFrames: number;
  calculateMetadata: CalculateMetadataFunction<RemotionProps>;
};

export type PrimitivesDemoCompositionDefinition = {
  id: "primitives-demo";
  label: string;
  component: ComponentType<PrimitivesDemoProps>;
  defaultProps: PrimitivesDemoProps;
  durationInFrames: number;
  userFacing: false;
};

function defineComposition(
  format: RenderableContentFormat,
  label: string,
  component: ComponentType<RemotionProps>,
): RemotionCompositionDefinition {
  const defaultProps = defaultPropsByFormat[format];

  return {
    calculateMetadata,
    component,
    defaultProps,
    durationInFrames:
      defaultProps.durationInFrames ?? DEFAULT_REMOTION_DURATION_IN_FRAMES,
    format,
    id: compositionIdForFormat(format),
    label,
  };
}

export const remotionCompositions: RemotionCompositionDefinition[] = [
  defineComposition("slideshow", "Slideshow", Slideshow),
  defineComposition("wall_of_text", "Wall of text", WallOfText),
  defineComposition("greenscreen_meme", "Greenscreen meme", GreenscreenMeme),
  defineComposition("hook_demo", "Hook demo", HookDemo),
];

export const primitivesDemoComposition: PrimitivesDemoCompositionDefinition = {
  component: PrimitivesDemo,
  defaultProps: primitivesDemoFixture.props,
  durationInFrames: primitivesDemoFixture.props.durationInFrames,
  id: "primitives-demo",
  label: primitivesDemoFixture.label,
  userFacing: false,
};

export function getCompositionByFormat(
  format: RenderableContentFormat,
): RemotionCompositionDefinition {
  const definition = remotionCompositions.find(
    (composition) => composition.format === format,
  );

  if (!definition) {
    throw new Error(`No Remotion composition registered for ${format}.`);
  }

  return definition;
}

export function getCompositionById(
  compositionId: RemotionCompositionId,
): RemotionCompositionDefinition {
  const definition = remotionCompositions.find(
    (composition) => composition.id === compositionId,
  );

  if (!definition) {
    throw new Error(`No Remotion composition registered for ${compositionId}.`);
  }

  return definition;
}
