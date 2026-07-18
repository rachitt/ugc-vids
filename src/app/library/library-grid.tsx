"use client";

import { useState, useTransition } from "react";
import { Sparkles, Undo2, X } from "lucide-react";

import { ContentThumbnail } from "@/components/content/content-thumbnail";
import { FormatBadge } from "@/components/content/format-badge";
import { Button } from "@/components/ui/button";
import { getScriptHook, getScriptPreview } from "@/lib/content/display";
import type {
  ContentActionResult,
  ContentItemSummary,
  SaveLimit,
} from "@/lib/content/types";

import {
  moreLikeThisLibraryItem,
  rejectLibraryItem,
  unsaveLibraryItem,
} from "./actions";

type LibraryGridProps = {
  items: ContentItemSummary[];
  saveLimit: SaveLimit;
};

function getCapLabel(saveLimit: SaveLimit) {
  if (saveLimit.cap === null) {
    return `${saveLimit.savedCount} saved`;
  }

  return `${saveLimit.savedCount}/${saveLimit.cap} saved`;
}

export function LibraryGrid({ items, saveLimit }: LibraryGridProps) {
  const [visibleItems, setVisibleItems] = useState(items);
  const [message, setMessage] = useState<string | null>(null);
  const [signals, setSignals] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function restoreItem(item: ContentItemSummary, result: ContentActionResult) {
    if (result.ok) {
      return;
    }

    setVisibleItems((current) =>
      current.some((currentItem) => currentItem.id === item.id)
        ? current
        : [item, ...current],
    );
    setMessage(result.error);
  }

  function removeWithAction(
    item: ContentItemSummary,
    action: (contentItemId: string) => Promise<ContentActionResult>,
  ) {
    setMessage(null);
    setVisibleItems((current) =>
      current.filter((currentItem) => currentItem.id !== item.id),
    );

    startTransition(() => {
      void action(item.id)
        .then((result) => restoreItem(item, result))
        .catch(() => {
          setVisibleItems((current) =>
            current.some((currentItem) => currentItem.id === item.id)
              ? current
              : [item, ...current],
          );
          setMessage("The library action could not be saved. Try again.");
        });
    });
  }

  function signalMoreLikeThis(item: ContentItemSummary) {
    setMessage(null);
    setSignals((current) => ({ ...current, [item.id]: "Recording..." }));

    startTransition(() => {
      void moreLikeThisLibraryItem(item.id)
        .then((result) => {
          setSignals((current) => ({
            ...current,
            [item.id]: result.ok ? "Signal recorded" : "Signal failed",
          }));

          if (!result.ok) {
            setMessage(result.error);
          }
        })
        .catch(() => {
          setSignals((current) => ({
            ...current,
            [item.id]: "Signal failed",
          }));
          setMessage("The preference signal could not be saved. Try again.");
        });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Library capacity
          </p>
          <p className="text-2xl font-semibold tracking-normal">
            {getCapLabel(saveLimit)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Plan: {saveLimit.plan}</p>
      </div>

      {message ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm leading-6 text-muted-foreground">
          No saved content yet. Save generated items from Blitz to build this
          library.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              className="grid min-h-[420px] grid-cols-[120px_1fr] gap-4 rounded-lg border bg-card p-4 text-card-foreground sm:grid-cols-1"
              key={item.id}
            >
              <ContentThumbnail
                className="w-full self-center sm:self-start"
                format={item.format}
                thumbUrl={item.thumbUrl}
              />
              <div className="flex min-w-0 flex-col">
                <div className="mb-3">
                  <FormatBadge format={item.format} />
                </div>
                <h2 className="text-lg font-semibold leading-tight tracking-normal">
                  {getScriptHook(item.script)}
                </h2>
                <p className="mt-3 line-clamp-5 text-sm leading-6 text-muted-foreground">
                  {getScriptPreview(item.script)}
                </p>
                {item.script.hashtags && item.script.hashtags.length > 0 ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.script.hashtags.map((tag) => `#${tag}`).join(" ")}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Button
                    disabled={isPending}
                    onClick={() => signalMoreLikeThis(item)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    More like this
                  </Button>
                  <Button
                    aria-label="Unsave content item"
                    disabled={isPending}
                    onClick={() => removeWithAction(item, unsaveLibraryItem)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                    Unsave
                  </Button>
                  <Button
                    aria-label="Reject content item"
                    disabled={isPending}
                    onClick={() => removeWithAction(item, rejectLibraryItem)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Reject
                  </Button>
                </div>
                {signals[item.id] ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {signals[item.id]}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
