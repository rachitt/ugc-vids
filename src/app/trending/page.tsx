import Link from "next/link";
import { Filter, Settings, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDefaultGenerationWorkspaceId } from "@/lib/content/generation-contract";
import {
  getTrendTemplateFilterOptions,
  isRemotionCompositionId,
  listTrendTemplates,
} from "@/lib/trends/queries";
import type { RemotionCompositionId } from "@/lib/video/remotion-props";

import { remixTrendAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

type TrendingPageProps = {
  searchParams?: Promise<SearchParams>;
};

type TrendHrefFilters = {
  format?: RemotionCompositionId;
  niche?: string;
};

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trendingHref(filters: TrendHrefFilters) {
  const query: Record<string, string> = {};

  if (filters.niche) {
    query.niche = filters.niche;
  }

  if (filters.format) {
    query.format = filters.format;
  }

  return {
    pathname: "/trending" as const,
    query,
  };
}

function remixMessage(status: string | undefined): string | null {
  switch (status) {
    case "created":
      return "Remix created as a generated content item.";
    case "missing-workspace":
      return "No workspace is available for this dev stub, so remixing is disabled until a workspace exists.";
    case "missing-trend":
      return "That trend template could not be found.";
    default:
      return null;
  }
}

export default async function TrendingPage({
  searchParams,
}: TrendingPageProps) {
  const params = searchParams ? await searchParams : {};
  const niche = firstParam(params.niche)?.toLowerCase();
  const formatParam = firstParam(params.format);
  const format = isRemotionCompositionId(formatParam) ? formatParam : undefined;
  const [trends, filterOptions, workspaceId] = await Promise.all([
    listTrendTemplates({
      format,
      nicheTag: niche,
    }),
    getTrendTemplateFilterOptions(),
    getDefaultGenerationWorkspaceId(),
  ]);
  const message = remixMessage(firstParam(params.remix));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <Filter className="size-4" aria-hidden="true" />
              Trend library
            </p>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Remixable short-form patterns
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Curated patterns with structure notes, engagement rationale, and
                Remotion format mapping.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={{ pathname: "/trending/admin" }}>
              <Settings className="size-4" aria-hidden="true" />
              Admin
            </Link>
          </Button>
        </div>

        {message ? (
          <div className="rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="flex flex-col gap-5">
            <div className="rounded-lg border bg-card p-4 text-card-foreground">
              <p className="mb-3 text-sm font-semibold">Niche</p>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <Button
                  asChild
                  size="sm"
                  variant={niche ? "ghost" : "secondary"}
                >
                  <Link href={trendingHref({ format })}>All niches</Link>
                </Button>
                {filterOptions.nicheTags.map((tag) => (
                  <Button
                    asChild
                    key={tag}
                    size="sm"
                    variant={niche === tag ? "secondary" : "ghost"}
                  >
                    <Link href={trendingHref({ format, niche: tag })}>
                      {tag}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 text-card-foreground">
              <p className="mb-3 text-sm font-semibold">Format</p>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <Button
                  asChild
                  size="sm"
                  variant={format ? "ghost" : "secondary"}
                >
                  <Link href={trendingHref({ niche })}>All formats</Link>
                </Button>
                {filterOptions.formats.map((option) => (
                  <Button
                    asChild
                    key={option.id}
                    size="sm"
                    variant={format === option.id ? "secondary" : "ghost"}
                  >
                    <Link href={trendingHref({ format: option.id, niche })}>
                      {option.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {trends.length} {trends.length === 1 ? "trend" : "trends"}
              </p>
              {!workspaceId ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Remixing needs an existing workspace id.
                </p>
              ) : null}
            </div>

            {trends.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {trends.map((trend) => (
                  <article
                    className="flex min-h-[340px] flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground"
                    key={trend.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        {trend.remotionTemplateLabel}
                      </span>
                      {trend.nicheTags.map((tag) => (
                        <span
                          className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                      <div>
                        <h2 className="text-xl font-semibold tracking-normal">
                          {trend.title}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {trend.structureDescription}
                        </p>
                      </div>

                      {trend.engagementNotes ? (
                        <div className="rounded-md border bg-muted/50 p-3">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Engagement notes
                          </p>
                          <p className="mt-2 text-sm leading-6">
                            {trend.engagementNotes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <form action={remixTrendAction}>
                      <input name="trendId" type="hidden" value={trend.id} />
                      <Button
                        className="w-full"
                        disabled={!workspaceId || !trend.contentFormat}
                        type="submit"
                      >
                        <WandSparkles className="size-4" aria-hidden="true" />
                        Remix trend
                      </Button>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center text-card-foreground">
                <p className="font-medium">No trend templates match.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clear a filter or add a trend in admin.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
