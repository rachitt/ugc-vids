"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useMemo } from "react";

import {
  getRemotionDurationInFrames,
  REMOTION_FPS,
  REMOTION_VIDEO_HEIGHT,
  REMOTION_VIDEO_WIDTH,
  type RemotionProps,
} from "@/lib/video/remotion-props";
import { getCompositionByFormat } from "@/remotion/registry";

const Player = dynamic(
  () => import("@remotion/player").then((module) => module.Player),
  {
    ssr: false,
  },
);

export function ContentItemPreview({ props }: { props: RemotionProps }) {
  const composition = useMemo(
    () => getCompositionByFormat(props.format),
    [props.format],
  );

  return (
    <div className="aspect-[9/16] w-full overflow-hidden rounded-md bg-black">
      <Player
        component={composition.component as ComponentType<Record<string, unknown>>}
        compositionHeight={REMOTION_VIDEO_HEIGHT}
        compositionWidth={REMOTION_VIDEO_WIDTH}
        controls
        durationInFrames={getRemotionDurationInFrames(props)}
        fps={REMOTION_FPS}
        inputProps={props}
        loop
        style={{
          height: "100%",
          width: "100%",
        }}
      />
    </div>
  );
}
