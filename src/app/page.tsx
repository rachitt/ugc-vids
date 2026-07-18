import Link from "next/link";
import type { Route } from "next";
import { desc } from "drizzle-orm";
import { ArrowRight, Globe2, Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrandProfileAction } from "@/app/brand-profiles/actions";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const error =
    typeof params?.error === "string" ? params.error : params?.error?.[0];
  const recentProfiles = await getRecentBrandProfiles();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fastlane
              </p>
              <h1 className="text-2xl font-semibold tracking-normal">
                Brand profile
              </h1>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="flex flex-col gap-6 pt-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                Phase 1
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
                Turn a website into a usable UGC brand brief.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                Fastlane reads the landing page, pricing page, and about page,
                then saves an editable profile for the content engine.
              </p>
            </div>

            <form
              action={createBrandProfileAction}
              className="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <label className="text-sm font-medium" htmlFor="url">
                Website URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Globe2
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    className="h-11 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                    id="url"
                    name="url"
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
                <Button className="h-11 sm:w-36" type="submit">
                  Analyze
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </form>
          </section>

          <aside className="flex flex-col gap-3 pt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Recent profiles</h2>
              <Tag
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            {recentProfiles.length > 0 ? (
              <div className="grid gap-3">
                {recentProfiles.map((profile) => (
                  <Link
                    className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-ring"
                    href={`/brand-profiles/${profile.id}` as Route}
                    key={profile.id}
                  >
                    <p className="line-clamp-1 text-sm font-medium">
                      {getHostname(profile.url)}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {profile.productDesc ?? profile.audience ?? profile.url}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.nicheTags.slice(0, 3).map((tag) => (
                        <span
                          className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                No brand profiles yet.
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

async function getRecentBrandProfiles() {
  return db
    .select({
      audience: brandProfiles.audience,
      id: brandProfiles.id,
      nicheTags: brandProfiles.nicheTags,
      productDesc: brandProfiles.productDesc,
      url: brandProfiles.url,
    })
    .from(brandProfiles)
    .orderBy(desc(brandProfiles.updatedAt))
    .limit(6);
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
