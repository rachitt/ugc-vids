import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  Check,
  Clock3,
  FileText,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  generateContentBatchAction,
  rejectContentItemAction,
  saveContentItemAction,
} from "@/app/content/actions";
import { ContentItemPreview } from "@/components/content/content-item-preview";
import { Button } from "@/components/ui/button";
import {
  contentFormatLabels,
  DEFAULT_MIXED_BATCH_SIZE,
  isRenderableContentFormat,
  type RenderableContentFormat,
} from "@/lib/content/formats";
import { db } from "@/lib/db";
import { brandProfiles, contentItems } from "@/lib/db/schema";
import { getOrCreateDefaultWorkspace } from "@/lib/workspaces";
import {
  validateRemotionProps,
  type RemotionProps,
} from "@/lib/video/remotion-props";

export const dynamic = "force-dynamic";

type ContentPageProps = {
  searchParams?: Promise<{
    brandProfileId?: string | string[];
    error?: string | string[];
    exported?: string | string[];
    failed?: string | string[];
    generated?: string | string[];
    rejected?: string | string[];
    saved?: string | string[];
  }>;
};

type ContentListItem = {
  brandProfileId: string | null;
  createdAt: Date;
  format: RenderableContentFormat;
  id: string;
  preview: string;
  renderStatus: string;
  remotionProps: RemotionProps | null;
  script: {
    caption?: string;
    hashtags?: string[];
    hook?: string;
    lines?: string[];
    slides?: string[];
  };
  status: string;
  videoUrl: string | null;
};

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const params = await searchParams;
  const workspace = await getOrCreateDefaultWorkspace();
  const profiles = await getBrandProfiles(workspace.id);
  const selectedProfileId =
    getSingleParam(params?.brandProfileId) ?? profiles[0]?.id ?? "";
  const items = await getContentItems(workspace.id);
  const message = buildStatusMessage(params);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col gap-7 px-6 py-8">
        <header className="flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Fastlane
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                Content
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">Brand profiles</Link>
            </Button>
          </div>
        </header>

        <section className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <form
            action={generateContentBatchAction}
            className="flex flex-col gap-4 lg:flex-row lg:items-end"
          >
            <input name="workspaceId" type="hidden" value={workspace.id} />
            <input
              name="totalCount"
              type="hidden"
              value={DEFAULT_MIXED_BATCH_SIZE}
            />
            <div className="grid flex-1 gap-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="brandProfileId"
              >
                Brand profile
              </label>
              <select
                className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                defaultValue={selectedProfileId}
                disabled={profiles.length === 0}
                id="brandProfileId"
                name="brandProfileId"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {hostnameFromUrl(profile.url)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-11 lg:w-44"
              disabled={profiles.length === 0}
              type="submit"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Generate batch
            </Button>
          </form>
          {profiles.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Create a brand profile before generating content.
            </p>
          ) : null}
          {message ? (
            <p className="mt-3 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm text-secondary-foreground">
              {message}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Generated items</h2>
            <span className="text-sm text-muted-foreground">
              {items.length} recent
            </span>
          </div>

          {items.length > 0 ? (
            <div className="grid gap-4">
              {items.map((item) => (
                <ContentItemCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm leading-6 text-muted-foreground">
              No generated content yet.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ContentItemCard({ item }: { item: ContentListItem }) {
  const canSave = item.status === "generated";
  const createdAt = item.createdAt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="grid gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="w-full max-w-[220px]">
        {item.remotionProps ? (
          <ContentItemPreview props={item.remotionProps} />
        ) : (
          <div className="flex aspect-[9/16] items-center justify-center rounded-md border border-dashed bg-muted text-sm text-muted-foreground">
            Invalid props
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {contentFormatLabels[item.format]}
          </span>
          <span className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
            {item.status}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
            <Clock3 className="size-3" aria-hidden="true" />
            {item.renderStatus}
          </span>
          <span className="text-xs text-muted-foreground">{createdAt}</span>
        </div>

        <div className="grid gap-2">
          <h3 className="line-clamp-2 text-lg font-semibold tracking-normal">
            {item.script.hook ?? "Untitled script"}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {item.preview}
          </p>
          {item.script.caption ? (
            <p className="line-clamp-2 text-sm leading-6">
              {item.script.caption}
            </p>
          ) : null}
        </div>

        {item.script.hashtags && item.script.hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.script.hashtags.slice(0, 8).map((hashtag) => (
              <span
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                key={hashtag}
              >
                {hashtag}
              </span>
            ))}
          </div>
        ) : null}

        {item.videoUrl ? (
          <a
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            href={item.videoUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open rendered video
          </a>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <form action={saveContentItemAction}>
            <input name="contentItemId" type="hidden" value={item.id} />
            <Button disabled={!canSave} type="submit">
              {item.status === "saved" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {item.status === "saved" ? "Saved" : "Save"}
            </Button>
          </form>
          <form action={rejectContentItemAction}>
            <input name="contentItemId" type="hidden" value={item.id} />
            <Button type="submit" variant="outline">
              <Trash2 className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}

async function getBrandProfiles(workspaceId: string) {
  return db
    .select({
      id: brandProfiles.id,
      url: brandProfiles.url,
    })
    .from(brandProfiles)
    .where(eq(brandProfiles.workspaceId, workspaceId))
    .orderBy(desc(brandProfiles.updatedAt));
}

async function getContentItems(workspaceId: string): Promise<ContentListItem[]> {
  const rows = await db
    .select({
      brandProfileId: contentItems.brandProfileId,
      createdAt: contentItems.createdAt,
      format: contentItems.format,
      id: contentItems.id,
      renderStatus: contentItems.renderStatus,
      remotionProps: contentItems.remotionProps,
      script: contentItems.script,
      status: contentItems.status,
      videoUrl: contentItems.videoUrl,
    })
    .from(contentItems)
    .where(eq(contentItems.workspaceId, workspaceId))
    .orderBy(desc(contentItems.createdAt))
    .limit(24);

  return rows
    .filter(
      (row) => row.status !== "rejected" && isRenderableContentFormat(row.format),
    )
    .map((row) => {
      const remotionProps = safeValidateRemotionProps(row.remotionProps);

      return {
        ...row,
        format: row.format as RenderableContentFormat,
        preview: buildScriptPreview(row.script),
        remotionProps,
      };
    });
}

function buildScriptPreview(script: ContentListItem["script"]) {
  const parts = [
    script.hook,
    ...(script.slides ?? []),
    ...(script.lines ?? []),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" ") : "No script preview available.";
}

function safeValidateRemotionProps(value: unknown) {
  try {
    return validateRemotionProps(value);
  } catch {
    return null;
  }
}

function buildStatusMessage(params: Awaited<ContentPageProps["searchParams"]>) {
  const error = getSingleParam(params?.error);

  if (error) {
    return error;
  }

  const generated = getSingleParam(params?.generated);
  const failed = getSingleParam(params?.failed);

  if (generated || failed) {
    return `Generated ${generated ?? "0"} item(s); ${failed ?? "0"} failed.`;
  }

  if (getSingleParam(params?.saved)) {
    return "Saved and queued for render.";
  }

  if (getSingleParam(params?.exported)) {
    return "Export queued for render.";
  }

  if (getSingleParam(params?.rejected)) {
    return "Item rejected.";
  }

  return null;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
