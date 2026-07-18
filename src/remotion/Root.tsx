import { Composition } from "remotion";

import { PlaceholderVideo } from "./PlaceholderVideo";

export function RemotionRoot() {
  return (
    <Composition
      component={PlaceholderVideo}
      defaultProps={{
        subtitle: "Phase 0",
        title: "Fastlane",
      }}
      durationInFrames={90}
      fps={30}
      height={1920}
      id="PlaceholderVideo"
      width={1080}
    />
  );
}
