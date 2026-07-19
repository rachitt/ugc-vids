import { Composition } from "remotion";

import {
  REMOTION_FPS,
  REMOTION_VIDEO_HEIGHT,
  REMOTION_VIDEO_WIDTH,
  RemotionPropsSchema,
} from "../lib/video/remotion-props";
import { primitivesDemoComposition, remotionCompositions } from "./registry";

export function RemotionRoot() {
  return (
    <>
      {remotionCompositions.map((composition) => (
        <Composition
          calculateMetadata={composition.calculateMetadata}
          component={composition.component}
          defaultProps={composition.defaultProps}
          durationInFrames={composition.durationInFrames}
          fps={REMOTION_FPS}
          height={REMOTION_VIDEO_HEIGHT}
          id={composition.id}
          key={composition.id}
          schema={RemotionPropsSchema}
          width={REMOTION_VIDEO_WIDTH}
        />
      ))}
      <Composition
        component={primitivesDemoComposition.component}
        defaultProps={primitivesDemoComposition.defaultProps}
        durationInFrames={primitivesDemoComposition.durationInFrames}
        fps={REMOTION_FPS}
        height={REMOTION_VIDEO_HEIGHT}
        id={primitivesDemoComposition.id}
        width={REMOTION_VIDEO_WIDTH}
      />
    </>
  );
}
