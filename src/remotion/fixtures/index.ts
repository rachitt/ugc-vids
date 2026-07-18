import {
  type ContentFormat,
  type RemotionProps,
  validateRemotionProps,
} from "../../lib/video/remotion-props";

import greenscreenMemeFixture from "./greenscreen-meme.json";
import hookDemoFixture from "./hook-demo.json";
import slideshowFixture from "./slideshow.json";
import wallOfTextFixture from "./wall-of-text.json";

export type RemotionFixture = {
  id: string;
  label: string;
  format: ContentFormat;
  props: RemotionProps;
};

export const remotionFixtures: RemotionFixture[] = [
  {
    format: "slideshow",
    id: "slideshow-default",
    label: "Slideshow: launch reasons",
    props: validateRemotionProps(slideshowFixture),
  },
  {
    format: "wall_of_text",
    id: "wall-of-text-default",
    label: "Wall of text: support inbox",
    props: validateRemotionProps(wallOfTextFixture),
  },
  {
    format: "greenscreen_meme",
    id: "greenscreen-meme-default",
    label: "Greenscreen meme: spreadsheet",
    props: validateRemotionProps(greenscreenMemeFixture),
  },
  {
    format: "hook_demo",
    id: "hook-demo-default",
    label: "Hook demo: attribution",
    props: validateRemotionProps(hookDemoFixture),
  },
];

export function fixturesForFormat(format: ContentFormat): RemotionFixture[] {
  return remotionFixtures.filter((fixture) => fixture.format === format);
}
