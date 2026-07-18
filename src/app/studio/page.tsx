import Link from "next/link";
import Image from "next/image";
import { Filter, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudioNav } from "@/components/studio/StudioNav";
import {
  getAvatarDisplayMetadata,
  listAvatars,
  parseAvatarKind,
} from "@/lib/avatars";
import { createPortraitPlaceholderDataUri } from "@/lib/avatars/placeholders";

import {
  firstSearchParam,
  resolveStudioWorkspace,
  type StudioSearchParams,
} from "./workspace";

type StudioPageProps = {
  searchParams?: Promise<StudioSearchParams>;
};

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
        className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm normal-case text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
          key={tag}
        >
          {labelFor(tag)}
        </span>
      ))}
    </div>
  );
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const params = searchParams ? await searchParams : {};
  const workspace = await resolveStudioWorkspace(params);
  const selectedKind = parseAvatarKind(filterValue(params, "kind"));
  const filters = {
    workspaceId: workspace?.id,
    kind: selectedKind,
    persona: filterValue(params, "persona"),
    gender: filterValue(params, "gender"),
    style: filterValue(params, "style"),
    tone: filterValue(params, "tone"),
    niche: filterValue(params, "niche"),
  };
  const avatarResult = await listAvatars(filters);
  const resetHref = {
    pathname: "/studio",
    query: workspace ? { workspaceId: workspace.id } : undefined,
  } as const;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 border-b pb-6">
          <StudioNav active="avatars" workspaceId={workspace?.id} />
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                AI Influencer Studio
              </p>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Avatar library
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse library avatars and custom workspace avatars by persona,
                style, tone, niche, and gender metadata.
              </p>
            </div>
            <Button asChild>
              <Link
                href={{
                  pathname: "/studio/new",
                  query: workspace ? { workspaceId: workspace.id } : undefined,
                }}
              >
                <Sparkles aria-hidden="true" />
                New avatar
              </Link>
            </Button>
          </div>
          {workspace ? (
            <p className="text-sm text-muted-foreground">
              Workspace:{" "}
              <span className="font-medium text-foreground">
                {workspace.name}
              </span>{" "}
              ({labelFor(workspace.plan)})
            </p>
          ) : null}
        </div>

        <form
          action="/studio"
          className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
        >
          {workspace ? (
            <input name="workspaceId" type="hidden" value={workspace.id} />
          ) : null}
          <label className="grid gap-2 text-xs font-medium uppercase text-muted-foreground">
            Kind
            <select
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm normal-case text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue={selectedKind ?? ""}
              name="kind"
            >
              <option value="">Any</option>
              <option value="library">Library</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <FilterSelect
            label="Persona"
            name="persona"
            options={avatarResult.filterOptions.personas}
            value={filters.persona}
          />
          <FilterSelect
            label="Style"
            name="style"
            options={avatarResult.filterOptions.styles}
            value={filters.style}
          />
          <FilterSelect
            label="Tone"
            name="tone"
            options={avatarResult.filterOptions.tones}
            value={filters.tone}
          />
          <FilterSelect
            label="Niche"
            name="niche"
            options={avatarResult.filterOptions.niches}
            value={filters.niche}
          />
          <FilterSelect
            label="Gender"
            name="gender"
            options={avatarResult.filterOptions.genders}
            value={filters.gender}
          />
          <Button type="submit" variant="secondary">
            <Filter aria-hidden="true" />
            Apply
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href={resetHref}>Reset</Link>
          </Button>
        </form>

        {avatarResult.avatars.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {avatarResult.avatars.map((avatar) => {
              const metadata = getAvatarDisplayMetadata(avatar);
              const imageUrl =
                avatar.imageUrls[0] ??
                createPortraitPlaceholderDataUri({
                  name: avatar.name,
                  label: labelFor(avatar.kind),
                  seed: avatar.id,
                });

              return (
                <article
                  className="overflow-hidden rounded-lg border bg-card text-card-foreground"
                  key={avatar.id}
                >
                  <Image
                    alt={`${avatar.name} portrait`}
                    className="aspect-[4/5] w-full object-cover"
                    height={640}
                    unoptimized
                    src={imageUrl}
                    width={512}
                  />
                  <div className="grid gap-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {avatar.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {labelFor(avatar.kind)}
                          {metadata.persona
                            ? ` / ${labelFor(metadata.persona)}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded-md border px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
                        {avatar.kind}
                      </span>
                    </div>

                    <dl className="grid gap-2 text-sm">
                      {metadata.style ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Style</dt>
                          <dd className="text-right font-medium">
                            {labelFor(metadata.style)}
                          </dd>
                        </div>
                      ) : null}
                      {metadata.gender ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Gender</dt>
                          <dd className="text-right font-medium">
                            {labelFor(metadata.gender)}
                          </dd>
                        </div>
                      ) : null}
                      {metadata.ageRange ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Age</dt>
                          <dd className="text-right font-medium">
                            {metadata.ageRange}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <TagList tags={metadata.toneTags ?? []} />
                    <TagList tags={metadata.nicheTags ?? []} />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">No avatars found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Run the avatar seed script or adjust the active filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
