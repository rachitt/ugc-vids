"use client";

import dynamic from "next/dynamic";
import { Film, MonitorPlay } from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  contentFormatLabels,
  type RenderableContentFormat,
} from "@/lib/content/formats";
import {
  REMOTION_FPS,
  REMOTION_VIDEO_HEIGHT,
  REMOTION_VIDEO_WIDTH,
  getRemotionDurationInFrames,
} from "@/lib/video/remotion-props";
import {
  fixturesForFormat,
  type RemotionFixture,
} from "@/remotion/fixtures";
import { getCompositionByFormat, remotionCompositions } from "@/remotion/registry";

const Player = dynamic(
  () => import("@remotion/player").then((module) => module.Player),
  {
    ssr: false,
  },
);

function firstFixtureForFormat(format: RenderableContentFormat): RemotionFixture {
  const fixture = fixturesForFormat(format)[0];

  if (!fixture) {
    throw new Error(`No fixture registered for ${format}.`);
  }

  return fixture;
}

export default function RemotionPreviewPage() {
  const [format, setFormat] = useState<RenderableContentFormat>("slideshow");
  const [fixtureId, setFixtureId] = useState(
    () => firstFixtureForFormat("slideshow").id,
  );

  const fixtures = useMemo(() => fixturesForFormat(format), [format]);
  const fixture =
    fixtures.find((candidate) => candidate.id === fixtureId) ?? fixtures[0];
  const composition = getCompositionByFormat(format);

  function selectFormat(nextFormat: RenderableContentFormat) {
    setFormat(nextFormat);
    setFixtureId(firstFixtureForFormat(nextFormat).id);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-6">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-emerald-300">
              <MonitorPlay className="size-4" aria-hidden="true" />
              Remotion preview
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Content engine templates
            </h1>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="format"
            >
              Format
            </label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-50 outline-none ring-emerald-300 focus:ring-2"
              id="format"
              onChange={(event) =>
                selectFormat(event.target.value as RenderableContentFormat)
              }
              value={format}
            >
              {remotionCompositions.map((definition) => (
                <option key={definition.format} value={definition.format}>
                  {contentFormatLabels[definition.format]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="fixture"
            >
              Fixture
            </label>
            <select
              className="h-11 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm text-slate-50 outline-none ring-emerald-300 focus:ring-2"
              id="fixture"
              onChange={(event) => setFixtureId(event.target.value)}
              value={fixture?.id}
            >
              {fixtures.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Film className="size-4" aria-hidden="true" />
              Render metadata
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-slate-400">Composition</dt>
              <dd className="text-right font-medium">{composition.id}</dd>
              <dt className="text-slate-400">Size</dt>
              <dd className="text-right font-medium">
                {REMOTION_VIDEO_WIDTH}x{REMOTION_VIDEO_HEIGHT}
              </dd>
              <dt className="text-slate-400">FPS</dt>
              <dd className="text-right font-medium">{REMOTION_FPS}</dd>
              <dt className="text-slate-400">Frames</dt>
              <dd className="text-right font-medium">
                {fixture ? getRemotionDurationInFrames(fixture.props) : 0}
              </dd>
            </dl>
          </div>

          <Button
            className="w-full"
            onClick={() => setFixtureId(firstFixtureForFormat(format).id)}
            type="button"
            variant="secondary"
          >
            Reset fixture
          </Button>
        </aside>

        <div className="flex min-h-[720px] items-center justify-center">
          <div className="aspect-[9/16] h-[min(82vh,920px)] overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/40">
            {fixture ? (
              <Player
                component={
                  composition.component as ComponentType<Record<string, unknown>>
                }
                compositionHeight={REMOTION_VIDEO_HEIGHT}
                compositionWidth={REMOTION_VIDEO_WIDTH}
                controls
                durationInFrames={getRemotionDurationInFrames(fixture.props)}
                fps={REMOTION_FPS}
                inputProps={fixture.props}
                key={fixture.id}
                style={{
                  height: "100%",
                  width: "100%",
                }}
              />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
