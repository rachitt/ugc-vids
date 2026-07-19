import type { RenderableContentFormat } from "../../lib/content/formats";
import {
  compositionIdForFormat,
  type RemotionProps,
  validateRemotionProps,
} from "../../lib/video/remotion-props";
import type { PrimitivesDemoProps } from "../PrimitivesDemo";

import greenscreenMemeFixture from "./greenscreen-meme.json";
import hookDemoFixture from "./hook-demo.json";
import primitivesDemoFixtureJson from "./primitives-demo.json";
import slideshowFixture from "./slideshow.json";
import wallOfTextFixture from "./wall-of-text.json";

export type RemotionFixture = {
  id: string;
  label: string;
  format: RenderableContentFormat;
  props: RemotionProps;
};

export type RemotionReviewFixture = {
  id: string;
  label: string;
  compositionId: "primitives-demo";
  props: PrimitivesDemoProps;
};

export type RemotionStillFixture = {
  id: string;
  label: string;
  compositionId: string;
  props: Record<string, unknown>;
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

export const primitivesDemoFixture: RemotionReviewFixture = {
  compositionId: "primitives-demo",
  id: "primitives-demo",
  label: "Primitives demo",
  props: primitivesDemoFixtureJson as PrimitivesDemoProps,
};

export const remotionStillFixtures: RemotionStillFixture[] = [
  ...remotionFixtures.map((fixture) => ({
    compositionId: compositionIdForFormat(fixture.format),
    id: fixture.id,
    label: fixture.label,
    props: fixture.props as Record<string, unknown>,
  })),
  {
    compositionId: primitivesDemoFixture.compositionId,
    id: primitivesDemoFixture.id,
    label: primitivesDemoFixture.label,
    props: primitivesDemoFixture.props as Record<string, unknown>,
  },
];

export function fixturesForFormat(
  format: RenderableContentFormat,
): RemotionFixture[] {
  return remotionFixtures.filter((fixture) => fixture.format === format);
}
