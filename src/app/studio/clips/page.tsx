import Link from "next/link";
import Image from "next/image";
import { Filter } from "lucide-react";
import { desc } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { StudioNav } from "@/components/studio/StudioNav";
import { db } from "@/lib/db";
import { humanUgcClips } from "@/lib/db/schema";

import {
  firstSearchParam,
  resolveStudioWorkspace,
  type StudioSearchParams,
} from "../workspace";

type ClipsPageProps = {
  searchParams?: Promise<StudioSearchParams>;
};

export const dynamic = "force-dynamic";

type ClipRow = typeof humanUgcClips.$inferSelect;

function filterValue(
  searchParams: StudioSearchParams,
  key: keyof StudioSearchParams,
) {
  const value = firstSearchParam(searchParams[key]);

  return value && value.trim() ? value.trim() : undefined;
}

function labelFor(value: string) {
  return value
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tagsInclude(tags: string[], selected?: string) {
  if (!selected) {
    return true;
  }

  return tags.some((tag) => tag.toLowerCase() === selected.toLowerCase());
}

function uniqueTags(clips: ClipRow[], key: "styleTags" | "genderTags") {
  return [...new Set(clips.flatMap((clip) => clip[key]))].sort();
}

function ClipPreview({ clip }: { clip: ClipRow }) {
  if (clip.clipUrl.startsWith("data:image/")) {
    return (
      <Image
        alt="UGC clip placeholder preview"
        className="aspect-video w-full object-cover"
        height={360}
        unoptimized
        src={clip.clipUrl}
        width={640}
      />
    );
  }

  if (
    clip.clipUrl.startsWith("data:video/") ||
    clip.clipUrl.startsWith("/") ||
    clip.clipUrl.endsWith(".mp4")
  ) {
    return (
      <video
        className="aspect-video w-full bg-muted object-cover"
        controls
        muted
        src={clip.clipUrl}
      />
    );
  }

  return (
    <div className="grid aspect-video place-items-center bg-muted px-4 text-center text-sm text-muted-foreground">
      {clip.clipUrl}
    </div>
  );
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: string[];
  value?: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium uppercase text-muted-foreground">
      {label}
      <select
        className="h-10 min-w-40 rounded-md border border-input bg-background px-3 text-sm normal-case text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelFor(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ClipsPage({ searchParams }: ClipsPageProps) {
  const params = searchParams ? await searchParams : {};
  const workspace = await resolveStudioWorkspace(params);
  const selectedStyle = filterValue(params, "style");
  const selectedGender = filterValue(params, "gender");
  const rows = await db
    .select()
    .from(humanUgcClips)
    .orderBy(desc(humanUgcClips.createdAt));
  const filteredClips = rows.filter(
    (clip) =>
      tagsInclude(clip.styleTags, selectedStyle) &&
      tagsInclude(clip.genderTags, selectedGender),
  );
  const resetHref = {
    pathname: "/studio/clips",
    query: workspace ? { workspaceId: workspace.id } : undefined,
  } as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 border-b pb-6">
          <StudioNav active="clips" workspaceId={workspace?.id} />
          <div className="grid gap-3">
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Human UGC library
            </p>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Clip library
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Browse seeded human UGC clip references by style and gender tags.
            </p>
          </div>
        </div>

        <form
          action="/studio/clips"
          className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        >
          {workspace ? (
            <input name="workspaceId" type="hidden" value={workspace.id} />
          ) : null}
          <FilterSelect
            label="Style"
            name="style"
            options={uniqueTags(rows, "styleTags")}
            value={selectedStyle}
          />
          <FilterSelect
            label="Gender"
            name="gender"
            options={uniqueTags(rows, "genderTags")}
            value={selectedGender}
          />
          <Button type="submit" variant="secondary">
            <Filter aria-hidden="true" />
            Apply
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href={resetHref}>Reset</Link>
          </Button>
        </form>

        {filteredClips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClips.map((clip) => (
              <article
                className="overflow-hidden rounded-lg border bg-card text-card-foreground"
                key={clip.id}
              >
                <ClipPreview clip={clip} />
                <div className="grid gap-3 p-4">
                  <div>
                    <h2 className="font-semibold">
                      {labelFor(clip.styleTags[0] ?? "UGC")} clip
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {clip.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[...clip.styleTags, ...clip.genderTags].map((tag) => (
                      <span
                        className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        key={tag}
                      >
                        {labelFor(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">No clips found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the clip seed script or adjust the active filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
