"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { Heart, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentThumbnail } from "@/components/content/content-thumbnail";
import { FormatBadge } from "@/components/content/format-badge";
import {
  getScriptBeats,
  getScriptHook,
  getScriptPreview,
} from "@/lib/content/display";
import type {
  ContentActionResult,
  ContentItemSummary,
  SaveLimit,
} from "@/lib/content/types";

import {
  rejectBlitzItem,
  requestMoreBlitzItems,
  saveBlitzItem,
} from "./actions";

type BlitzDeckProps = {
  items: ContentItemSummary[];
  lowDeckThreshold: number;
  saveLimit: SaveLimit;
};

type DragState = {
  active: boolean;
  dx: number;
  dy: number;
  itemId: string;
  pointerId: number;
  startX: number;
  startY: number;
};

type SwipeDirection = "left" | "right";

const SWIPE_THRESHOLD = 120;

function getSaveLimitLabel(saveLimit: SaveLimit) {
  if (saveLimit.cap === null) {
    return `${saveLimit.savedCount} saved`;
  }

  return `${saveLimit.savedCount}/${saveLimit.cap} saved`;
}

export function BlitzDeck({
  items,
  lowDeckThreshold,
  saveLimit,
}: BlitzDeckProps) {
  const [cards, setCards] = useState(items);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const currentCard = cards[0];
  const visibleCards = useMemo(() => cards.slice(0, 3), [cards]);
  const deckIsLow = cards.length <= lowDeckThreshold;

  function restoreCard(item: ContentItemSummary, result: ContentActionResult) {
    if (result.ok) {
      return;
    }

    setCards((current) =>
      current.some((card) => card.id === item.id)
        ? current
        : [item, ...current],
    );
    setMessage(result.error);
  }

  function commitSwipe(item: ContentItemSummary, direction: SwipeDirection) {
    setDrag(null);
    setMessage(null);
    setCards((current) => current.filter((card) => card.id !== item.id));

    const action = direction === "right" ? saveBlitzItem : rejectBlitzItem;

    startTransition(() => {
      void action(item.id)
        .then((result) => restoreCard(item, result))
        .catch(() => {
          setCards((current) =>
            current.some((card) => card.id === item.id)
              ? current
              : [item, ...current],
          );
          setMessage("The swipe could not be saved. Try again.");
        });
    });
  }

  function handlePointerDown(
    event: PointerEvent<HTMLElement>,
    item: ContentItemSummary,
  ) {
    if (event.button !== 0 || item.id !== currentCard?.id) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      active: true,
      dx: 0,
      dy: 0,
      itemId: item.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    setDrag((current) => {
      if (!current || current.pointerId !== event.pointerId) {
        return current;
      }

      return {
        ...current,
        dx: event.clientX - current.startX,
        dy: event.clientY - current.startY,
      };
    });
  }

  function handlePointerEnd(
    event: PointerEvent<HTMLElement>,
    item: ContentItemSummary,
  ) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(drag.dx) >= SWIPE_THRESHOLD) {
      commitSwipe(item, drag.dx > 0 ? "right" : "left");
      return;
    }

    setDrag(null);
  }

  function requestMore() {
    setGenerationMessage("Requesting more content...");

    startTransition(() => {
      void requestMoreBlitzItems()
        .then((result) =>
          setGenerationMessage(
            result.ok
              ? (result.message ?? "Generation request recorded.")
              : result.error,
          ),
        )
        .catch(() =>
          setGenerationMessage("The generation request could not be recorded."),
        );
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,440px)_1fr] lg:items-start">
      <section className="flex flex-col items-center gap-5">
        <div className="relative h-[560px] w-full max-w-[420px]">
          {visibleCards.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center text-sm leading-6 text-muted-foreground">
              No generated content is waiting in Blitz.
            </div>
          ) : (
            visibleCards.map((item, index) => {
              const isTopCard = index === 0;
              const activeDrag = drag?.itemId === item.id ? drag : null;
              const rotate = activeDrag ? activeDrag.dx / 18 : 0;
              const transform = activeDrag
                ? `translate3d(${activeDrag.dx}px, ${activeDrag.dy}px, 0) rotate(${rotate}deg)`
                : `translate3d(0, ${index * 12}px, 0) scale(${1 - index * 0.04})`;
              const style: CSSProperties = {
                transform,
                transition: activeDrag?.active
                  ? "none"
                  : "transform 180ms ease, opacity 180ms ease",
                zIndex: visibleCards.length - index,
              };
              const saveOpacity = Math.min(
                Math.max((activeDrag?.dx ?? 0) / SWIPE_THRESHOLD, 0),
                1,
              );
              const rejectOpacity = Math.min(
                Math.max(-((activeDrag?.dx ?? 0) / SWIPE_THRESHOLD), 0),
                1,
              );

              return (
                <article
                  aria-label={`${getScriptHook(item.script)} content card`}
                  className={`absolute inset-0 flex touch-none select-none flex-col overflow-hidden rounded-lg border bg-card shadow-lg ${
                    isTopCard
                      ? "cursor-grab active:cursor-grabbing"
                      : "pointer-events-none"
                  }`}
                  key={item.id}
                  onPointerCancel={(event) => handlePointerEnd(event, item)}
                  onPointerDown={(event) => handlePointerDown(event, item)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={(event) => handlePointerEnd(event, item)}
                  style={style}
                >
                  <div className="relative grid min-h-0 flex-1 grid-cols-[148px_1fr] gap-4 p-4">
                    <ContentThumbnail
                      className="h-full min-h-[360px]"
                      format={item.format}
                      thumbUrl={item.thumbUrl}
                    />
                    <div className="flex min-w-0 flex-col">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <FormatBadge format={item.format} />
                        <span className="text-xs text-muted-foreground">
                          {index + 1} of {cards.length}
                        </span>
                      </div>
                      <h2 className="text-2xl font-semibold leading-tight tracking-normal text-foreground">
                        {getScriptHook(item.script)}
                      </h2>
                      <p className="mt-4 line-clamp-6 text-sm leading-6 text-muted-foreground">
                        {getScriptPreview(item.script)}
                      </p>
                      <div className="mt-auto space-y-2 pt-5">
                        {getScriptBeats(item.script)
                          .slice(0, 3)
                          .map((beat, beatIndex) => (
                            <p
                              className="rounded-md bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground"
                              key={`${item.id}-${beatIndex}`}
                            >
                              {beat}
                            </p>
                          ))}
                      </div>
                    </div>
                    {isTopCard ? (
                      <>
                        <div
                          className="pointer-events-none absolute left-6 top-6 rounded-md border border-emerald-500 bg-emerald-50 px-3 py-1 text-sm font-semibold uppercase text-emerald-700"
                          style={{ opacity: saveOpacity }}
                        >
                          Save
                        </div>
                        <div
                          className="pointer-events-none absolute right-6 top-6 rounded-md border border-red-500 bg-red-50 px-3 py-1 text-sm font-semibold uppercase text-red-700"
                          style={{ opacity: rejectOpacity }}
                        >
                          Reject
                        </div>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="flex w-full max-w-[420px] items-center justify-center gap-3">
          <Button
            aria-label="Reject current card"
            disabled={!currentCard || isPending}
            onClick={() => currentCard && commitSwipe(currentCard, "left")}
            size="lg"
            type="button"
            variant="outline"
          >
            <X className="size-4" aria-hidden="true" />
            Reject
          </Button>
          <Button
            aria-label="Save current card"
            disabled={!currentCard || isPending}
            onClick={() => currentCard && commitSwipe(currentCard, "right")}
            size="lg"
            type="button"
          >
            <Heart className="size-4" aria-hidden="true" />
            Save
          </Button>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Workspace library cap
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {getSaveLimitLabel(saveLimit)}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Plan source: latest subscription row, defaulting to free when no
            subscription exists.
          </p>
        </div>

        {deckIsLow ? (
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-normal">
                  Deck is running low
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cards.length} generated items left.
                </p>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={isPending}
              onClick={requestMore}
              type="button"
              variant="secondary"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Generate more
            </Button>
            {generationMessage ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {generationMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {message}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
