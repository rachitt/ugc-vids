"use client";

import { useState, useTransition } from "react";
import {
  BarChart3,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { requestContentVariants } from "@/app/actions/variants";
import { Button } from "@/components/ui/button";
import {
  getContentFormatLabel,
  type ContentFormat,
} from "@/lib/content/formats";

export type TopContentMetric = {
  id: string;
  title: string;
  format: ContentFormat;
  status: string;
  views: number;
  likes: number;
  comments: number;
};

export type FunnelStep = {
  label: string;
  value: number;
};

export type AttributionMetric = {
  contentItemId: string;
  title: string;
  visitors: number;
  signups: number;
};

type AnalyticsDashboardProps = {
  topContent: TopContentMetric[];
  funnel: FunnelStep[];
  attribution: AttributionMetric[];
};

export function AnalyticsDashboard({
  attribution,
  funnel,
  topContent,
}: AnalyticsDashboardProps) {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const maxViews = Math.max(...topContent.map((item) => item.views), 1);
  const maxFunnel = Math.max(...funnel.map((step) => step.value), 1);
  const maxVisitors = Math.max(
    ...attribution.map((item) => Math.max(item.visitors, item.signups)),
    1,
  );
  const totalVisitors = attribution.reduce(
    (total, item) => total + item.visitors,
    0,
  );
  const totalSignups = attribution.reduce(
    (total, item) => total + item.signups,
    0,
  );

  function doubleDown(item: TopContentMetric) {
    setPendingItemId(item.id);
    setMessages((current) => ({
      ...current,
      [item.id]: "Requesting variants...",
    }));

    startTransition(() => {
      void requestContentVariants({
        contentItemId: item.id,
        count: 3,
        source: "manual",
      })
        .then((result) => {
          setMessages((current) => ({
            ...current,
            [item.id]: result.ok
              ? `${result.createdCount} variants queued - review in Blitz`
              : result.error,
          }));
        })
        .catch(() => {
          setMessages((current) => ({
            ...current,
            [item.id]: "The variant request could not be recorded.",
          }));
        })
        .finally(() => {
          setPendingItemId((current) => (current === item.id ? null : current));
        });
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile
          icon={BarChart3}
          label="Tracked views"
          value={formatNumber(
            topContent.reduce((total, item) => total + item.views, 0),
          )}
        />
        <SummaryTile
          icon={Users}
          label="Attributed visitors"
          value={formatNumber(totalVisitors)}
        />
        <SummaryTile
          icon={MousePointerClick}
          label="Attributed signups"
          value={formatNumber(totalSignups)}
        />
      </div>

      <section className="rounded-lg border bg-card p-5 text-card-foreground">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Top Content By Views</h2>
            <p className="text-sm text-muted-foreground">
              Latest entered metrics grouped by posted item.
            </p>
          </div>
          <TrendingUp className="size-5 text-secondary" aria-hidden="true" />
        </div>

        {topContent.length > 0 ? (
          <div className="grid gap-4">
            {topContent.map((item) => (
              <div className="grid gap-2" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs uppercase text-muted-foreground">
                      {getContentFormatLabel(item.format)} · {item.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatNumber(item.views)} views
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-secondary"
                    style={{ width: `${toPercent(item.views, maxViews)}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{formatNumber(item.likes)} likes</span>
                  <span>{formatNumber(item.comments)} comments</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    disabled={isPending}
                    onClick={() => doubleDown(item)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    {pendingItemId === item.id ? "Queueing" : "Double down"}
                  </Button>
                  {messages[item.id] ? (
                    <p className="text-xs text-muted-foreground">
                      {messages[item.id]}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState label="No post metrics yet." />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold">Saves To Posted Funnel</h2>
          <div className="mt-5 grid gap-4">
            {funnel.map((step) => (
              <div className="grid gap-2" key={step.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(step.value)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-accent"
                    style={{ width: `${toPercent(step.value, maxFunnel)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold">
            Visitors And Signups By Content
          </h2>
          {attribution.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {attribution.map((item) => (
                <div className="grid gap-2" key={item.contentItemId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatRate(item.signups, item.visitors)} signup rate
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <MetricBar
                      label="Visitors"
                      max={maxVisitors}
                      tone="bg-accent"
                      value={item.visitors}
                    />
                    <MetricBar
                      label="Signups"
                      max={maxVisitors}
                      tone="bg-secondary"
                      value={item.signups}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No attributed site events yet." />
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MetricBar({
  label,
  max,
  tone,
  value,
}: {
  label: string;
  max: number;
  tone: string;
  value: number;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr_56px] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-2 overflow-hidden rounded bg-muted">
        <div
          className={`h-full rounded ${tone}`}
          style={{ width: `${toPercent(value, max)}%` }}
        />
      </div>
      <span className="text-right font-medium">{formatNumber(value)}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function toPercent(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / max) * 100));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRate(signups: number, visitors: number) {
  if (visitors === 0) {
    return "0%";
  }

  return `${Math.round((signups / visitors) * 100)}%`;
}
