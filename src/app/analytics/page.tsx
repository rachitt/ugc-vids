import { and, desc, eq, inArray } from "drizzle-orm";
import { Plus, Upload } from "lucide-react";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AnalyticsDashboard,
  type AttributionMetric,
  type FunnelStep,
  type TopContentMetric,
} from "@/components/analytics-dashboard";
import { Button } from "@/components/ui/button";
import {
  normalizeMetricPlatform,
  parseNonNegativeMetric,
  parsePostMetricsCsv,
} from "@/lib/analytics/csv";
import { buildTaggedContentLink } from "@/lib/analytics/utm";
import { isUuid } from "@/lib/analytics/workspace-key";
import type { ContentFormat } from "@/lib/content/formats";
import { db } from "@/lib/db";
import { contentItems, postMetrics, siteEvents } from "@/lib/db/schema";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type AnalyticsPageProps = {
  searchParams?: Promise<SearchParams>;
};

type ContentScript = {
  hook?: string;
  slides?: string[];
  lines?: string[];
  caption?: string;
  hashtags?: string[];
};

type ContentRow = {
  id: string;
  format: ContentFormat;
  status: string;
  script: ContentScript;
};

type MetricRow = {
  contentItemId: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  capturedAt: Date;
  createdAt: Date;
};

type EventRow = {
  id: string;
  contentItemId: string | null;
  visitorId: string | null;
  eventName: string;
  utmContent: string | null;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = searchParams ? await searchParams : {};
  const data = await loadAnalyticsData();
  const notice = readParam(params, "notice");
  const error = readParam(params, "error");
  const imported = readParam(params, "imported");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8">
        <header className="grid gap-4 border-b pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Phase 8
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Post performance, saved-content movement, and website attribution.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 text-sm text-card-foreground">
            <p className="font-medium">
              {data.workspaceName ?? "No workspace"}
            </p>
            <p className="mt-1 max-w-[320px] break-all font-mono text-xs text-muted-foreground">
              {data.workspacePublicKey ?? "Seed fixtures to create demo data"}
            </p>
          </div>
        </header>

        {notice ? (
          <div className="rounded-md border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-foreground">
            {formatNotice(notice, imported)}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-lg border bg-card p-5 text-card-foreground">
            <h2 className="text-lg font-semibold">Tracking Snippet</h2>
            <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs leading-5 text-muted-foreground">
              {data.embedSnippet}
            </div>
            {data.sampleTaggedLink ? (
              <div className="mt-4 rounded-md border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tagged Link Preview
                </p>
                <p className="mt-2 break-all font-mono text-xs">
                  {data.sampleTaggedLink}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border bg-card p-5 text-card-foreground">
            <h2 className="text-lg font-semibold">Manual Metrics</h2>
            <form action={saveManualMetric} className="mt-4 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Content item
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  disabled={data.contentOptions.length === 0}
                  name="contentItemId"
                  required
                >
                  {data.contentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Platform
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    name="platform"
                    required
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Reels</option>
                    <option value="youtube">Shorts</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Captured
                  <input
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    name="capturedAt"
                    type="date"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricInput label="Views" name="views" />
                <MetricInput label="Likes" name="likes" />
                <MetricInput label="Comments" name="comments" />
              </div>

              <Button
                className="w-fit"
                disabled={data.contentOptions.length === 0}
                type="submit"
              >
                <Plus aria-hidden="true" />
                Save Metric
              </Button>
            </form>
          </section>
        </div>

        <section className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold">CSV Import</h2>
          <form
            action={importCsvMetrics}
            className="mt-4 grid gap-4"
            encType="multipart/form-data"
          >
            <input
              accept=".csv,text/csv"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              name="csvFile"
              type="file"
            />
            <textarea
              className="min-h-32 rounded-md border border-input bg-background p-3 font-mono text-sm"
              name="csv"
              placeholder="content_item_id,platform,views,likes,comments,captured_at"
            />
            <Button className="w-fit" type="submit" variant="outline">
              <Upload aria-hidden="true" />
              Import CSV
            </Button>
          </form>
        </section>

        <AnalyticsDashboard
          attribution={data.attribution}
          funnel={data.funnel}
          topContent={data.topContent}
        />
      </div>
    </main>
  );
}

async function saveManualMetric(formData: FormData) {
  "use server";

  const contentItemId = readFormText(formData, "contentItemId");
  const platform = normalizeMetricPlatform(readFormText(formData, "platform"));

  if (!isUuid(contentItemId)) {
    redirectWithError("Choose a valid content item");
  }

  if (!platform) {
    redirectWithError("Choose a valid platform");
  }

  const { workspace } = await getActiveWorkspaceContext();
  const contentItemExists = await hasContentItem(contentItemId, workspace.id);

  if (!contentItemExists) {
    redirectWithError("Content item was not found");
  }

  const capturedAt = parseCapturedAt(readFormText(formData, "capturedAt"));

  await db.insert(postMetrics).values({
    contentItemId,
    platform,
    source: "manual",
    views: parseMetricInput(formData, "views"),
    likes: parseMetricInput(formData, "likes"),
    comments: parseMetricInput(formData, "comments"),
    capturedAt,
  });

  revalidatePath("/analytics");
  redirect("/analytics?notice=manual-saved" as Route);
}

async function importCsvMetrics(formData: FormData) {
  "use server";

  const csvText = await readCsvText(formData);
  const { errors, rows } = parsePostMetricsCsv(csvText);

  if (errors.length > 0) {
    redirectWithError(errors.slice(0, 3).join(" "));
  }

  if (rows.length === 0) {
    redirectWithError("CSV did not contain metric rows");
  }

  const invalidIds = rows
    .map((row) => row.contentItemId)
    .filter((contentItemId) => !isUuid(contentItemId));

  if (invalidIds.length > 0) {
    redirectWithError("CSV contains an invalid content item id");
  }

  const { workspace } = await getActiveWorkspaceContext();
  const missingIds = await findMissingContentItemIds(
    rows.map((row) => row.contentItemId),
    workspace.id,
  );

  if (missingIds.length > 0) {
    redirectWithError(`CSV references unknown content item ${missingIds[0]}`);
  }

  await db.insert(postMetrics).values(
    rows.map((row) => ({
      contentItemId: row.contentItemId,
      platform: row.platform,
      source: "csv" as const,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      capturedAt: row.capturedAt ?? new Date(),
    })),
  );

  revalidatePath("/analytics");
  redirect(`/analytics?notice=csv-imported&imported=${rows.length}` as Route);
}

async function loadAnalyticsData() {
  const { workspace } = await getActiveWorkspaceContext();

  const contentRows = await db
    .select({
      id: contentItems.id,
      format: contentItems.format,
      script: contentItems.script,
      status: contentItems.status,
    })
    .from(contentItems)
    .where(eq(contentItems.workspaceId, workspace.id))
    .orderBy(desc(contentItems.createdAt))
    .limit(100);

  const contentIds = contentRows.map((item) => item.id);
  const metricRows =
    contentIds.length > 0
      ? await db
          .select({
            capturedAt: postMetrics.capturedAt,
            comments: postMetrics.comments,
            contentItemId: postMetrics.contentItemId,
            createdAt: postMetrics.createdAt,
            likes: postMetrics.likes,
            platform: postMetrics.platform,
            views: postMetrics.views,
          })
          .from(postMetrics)
          .where(inArray(postMetrics.contentItemId, contentIds))
      : [];
  const eventRows = await db
    .select({
      contentItemId: siteEvents.contentItemId,
      eventName: siteEvents.eventName,
      id: siteEvents.id,
      utmContent: siteEvents.utmContent,
      visitorId: siteEvents.visitorId,
    })
    .from(siteEvents)
    .where(eq(siteEvents.workspaceId, workspace.id));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const firstContentItem = contentRows[0];

  return {
    attribution: buildAttribution(contentRows, eventRows),
    contentOptions: contentRows.map((item) => ({
      id: item.id,
      title: getContentTitle(item),
    })),
    embedSnippet: `<script async src="${appUrl}/api/snippet.js" data-workspace-key="${workspace.id}" data-signup-selector="[data-fastlane-signup]"></script>`,
    funnel: buildFunnel(contentRows),
    sampleTaggedLink: firstContentItem
      ? buildTaggedContentLink({
          contentItemId: firstContentItem.id,
          destinationUrl: "https://example.com/signup",
          platform: "tiktok",
        })
      : null,
    topContent: buildTopContent(contentRows, metricRows),
    workspaceName: workspace.name,
    workspacePublicKey: workspace.id,
  };
}

function buildTopContent(
  contentRows: ContentRow[],
  metricRows: MetricRow[],
): TopContentMetric[] {
  const latestMetrics = new Map<string, MetricRow>();

  metricRows.forEach((metric) => {
    const key = `${metric.contentItemId}:${metric.platform}`;
    const current = latestMetrics.get(key);

    if (!current || isLaterMetric(metric, current)) {
      latestMetrics.set(key, metric);
    }
  });

  const totals = new Map<
    string,
    Pick<TopContentMetric, "views" | "likes" | "comments">
  >();

  latestMetrics.forEach((metric) => {
    const current = totals.get(metric.contentItemId) ?? {
      comments: 0,
      likes: 0,
      views: 0,
    };

    current.views += metric.views;
    current.likes += metric.likes;
    current.comments += metric.comments;
    totals.set(metric.contentItemId, current);
  });

  return contentRows
    .map((item) => {
      const total = totals.get(item.id) ?? {
        comments: 0,
        likes: 0,
        views: 0,
      };

      return {
        id: item.id,
        title: getContentTitle(item),
        format: item.format,
        status: item.status,
        ...total,
      };
    })
    .filter((item) => item.views > 0 || item.likes > 0 || item.comments > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);
}

function buildFunnel(contentRows: ContentRow[]): FunnelStep[] {
  const savedStatuses = new Set(["saved", "scheduled", "exported", "posted"]);
  const exportedStatuses = new Set(["exported", "posted"]);

  return [
    {
      label: "Saved",
      value: contentRows.filter((item) => savedStatuses.has(item.status))
        .length,
    },
    {
      label: "Exported",
      value: contentRows.filter((item) => exportedStatuses.has(item.status))
        .length,
    },
    {
      label: "Posted",
      value: contentRows.filter((item) => item.status === "posted").length,
    },
  ];
}

function buildAttribution(
  contentRows: ContentRow[],
  eventRows: EventRow[],
): AttributionMetric[] {
  const titleByContentId = new Map(
    contentRows.map((item) => [item.id, getContentTitle(item)]),
  );
  const attribution = new Map<
    string,
    {
      signups: number;
      visitors: Set<string>;
    }
  >();

  eventRows.forEach((event) => {
    const contentItemId =
      event.contentItemId ??
      (event.utmContent && titleByContentId.has(event.utmContent)
        ? event.utmContent
        : null);

    if (!contentItemId) {
      return;
    }

    const current = attribution.get(contentItemId) ?? {
      signups: 0,
      visitors: new Set<string>(),
    };
    const visitorKey = event.visitorId ?? event.id;

    if (event.eventName === "page_view" || event.eventName === "signup") {
      current.visitors.add(visitorKey);
    }

    if (event.eventName === "signup") {
      current.signups += 1;
    }

    attribution.set(contentItemId, current);
  });

  return Array.from(attribution.entries())
    .map(([contentItemId, metric]) => ({
      contentItemId,
      signups: metric.signups,
      title: titleByContentId.get(contentItemId) ?? contentItemId,
      visitors: metric.visitors.size,
    }))
    .sort((a, b) => b.signups - a.signups || b.visitors - a.visitors)
    .slice(0, 8);
}

function isLaterMetric(candidate: MetricRow, current: MetricRow) {
  const capturedDiff =
    candidate.capturedAt.getTime() - current.capturedAt.getTime();

  if (capturedDiff !== 0) {
    return capturedDiff > 0;
  }

  return candidate.createdAt.getTime() > current.createdAt.getTime();
}

function getContentTitle(item: ContentRow) {
  const hook = item.script.hook?.trim();

  if (hook) {
    return hook;
  }

  const caption = item.script.caption?.trim();

  if (caption) {
    return caption.slice(0, 72);
  }

  const firstLine = item.script.lines?.[0] ?? item.script.slides?.[0];

  if (firstLine) {
    return firstLine.slice(0, 72);
  }

  return `${item.format.replaceAll("_", " ")} ${item.id.slice(0, 8)}`;
}

function MetricInput({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        defaultValue="0"
        min="0"
        name={name}
        required
        type="number"
      />
    </label>
  );
}

function readParam(params: SearchParams, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

function formatNotice(notice: string, imported?: string) {
  if (notice === "manual-saved") {
    return "Metric saved.";
  }

  if (notice === "csv-imported") {
    return `Imported ${imported ?? "0"} CSV rows.`;
  }

  return notice;
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseMetricInput(formData: FormData, key: string) {
  try {
    return parseNonNegativeMetric(readFormText(formData, key), key);
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : `${key} is invalid`,
    );
  }
}

function parseCapturedAt(value: string) {
  if (!value) {
    return new Date();
  }

  const capturedAt = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(capturedAt.getTime())) {
    redirectWithError("Captured date is invalid");
  }

  return capturedAt;
}

async function readCsvText(formData: FormData) {
  const csvFile = formData.get("csvFile");

  if (isUploadedFile(csvFile) && csvFile.size > 0) {
    return csvFile.text();
  }

  return readFormText(formData, "csv");
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

async function hasContentItem(contentItemId: string, workspaceId: string) {
  const [contentItem] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.id, contentItemId),
        eq(contentItems.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  return Boolean(contentItem);
}

async function findMissingContentItemIds(
  contentItemIds: string[],
  workspaceId: string,
) {
  const uniqueIds = Array.from(new Set(contentItemIds));
  const existingRows = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(
      and(
        inArray(contentItems.id, uniqueIds),
        eq(contentItems.workspaceId, workspaceId),
      ),
    );
  const existingIds = new Set(existingRows.map((row) => row.id));

  return uniqueIds.filter((contentItemId) => !existingIds.has(contentItemId));
}

function redirectWithError(message: string): never {
  redirect(
    `/analytics?error=${encodeURIComponent(message.slice(0, 240))}` as Route,
  );
}
