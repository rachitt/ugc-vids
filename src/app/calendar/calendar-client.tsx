"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Film,
  Grid3X3,
  Rows3,
  Send,
} from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import {
  exportCalendarSlotAction,
  markCalendarSlotPostedAction,
  scheduleContentItemAction,
} from "@/app/calendar/actions";
import type {
  CalendarContentItem,
  CalendarSlot,
  CalendarView,
  CalendarWorkspace,
} from "@/app/calendar/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentFormatLabels } from "@/lib/content/formats";
import { cn } from "@/lib/utils";
import {
  getPlatformOption,
  publishingPlatforms,
  type PublishingPlatform,
} from "@/lib/publishing/platforms";

type CalendarClientProps = {
  workspace: CalendarWorkspace | null;
  contentItems: CalendarContentItem[];
  slots: CalendarSlot[];
  loadError?: string;
};

type Message = {
  kind: "success" | "error";
  text: string;
};

type LatestExport = {
  copyText: string;
  destinationUrl: string;
  caption: string;
  hashtags: string[];
};

const contentDragType = "application/x-fastlane-content-item";

const platformHours: Record<PublishingPlatform, number> = {
  tiktok: 10,
  instagram: 14,
  youtube: 18,
};

const slotStatusLabels: Record<CalendarSlot["status"], string> = {
  planned: "Planned",
  exported: "Exported",
  posted_manual: "Posted",
};

const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarClient({
  workspace,
  contentItems,
  slots,
  loadError,
}: CalendarClientProps) {
  const router = useRouter();
  const [view, setView] = React.useState<CalendarView>("week");
  const [anchorDate, setAnchorDate] = React.useState(() =>
    startOfDay(new Date()),
  );
  const [activeDropKey, setActiveDropKey] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<Message | null>(null);
  const [latestExport, setLatestExport] = React.useState<LatestExport | null>(
    null,
  );
  const [isPending, startTransition] = React.useTransition();

  const visibleDays = React.useMemo(
    () =>
      view === "week" ? getWeekDays(anchorDate) : getMonthGridDays(anchorDate),
    [anchorDate, view],
  );

  const slotsByKey = React.useMemo(() => {
    const map = new Map<string, CalendarSlot[]>();

    for (const slot of slots) {
      const date = new Date(slot.scheduledAt);
      const key = getDropKey(date, slot.platform);
      const existing = map.get(key) ?? [];
      existing.push(slot);
      map.set(key, existing);
    }

    for (const slotGroup of map.values()) {
      slotGroup.sort(
        (first, second) =>
          new Date(first.scheduledAt).getTime() -
          new Date(second.scheduledAt).getTime(),
      );
    }

    return map;
  }, [slots]);

  function shiftDate(direction: -1 | 1) {
    setAnchorDate((currentDate) =>
      view === "week"
        ? addDays(currentDate, direction * 7)
        : addMonths(currentDate, direction),
    );
  }

  function goToToday() {
    setAnchorDate(startOfDay(new Date()));
  }

  function handleDragStart(
    event: React.DragEvent<HTMLElement>,
    itemId: string,
  ) {
    event.dataTransfer.setData(contentDragType, itemId);
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleDrop(day: Date, platform: PublishingPlatform) {
    return (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setActiveDropKey(null);

      const contentItemId = event.dataTransfer.getData(contentDragType);

      if (!contentItemId) {
        return;
      }

      const scheduledAt = getScheduledDateForPlatform(day, platform);

      startTransition(() => {
        void scheduleContentItemAction({
          contentItemId,
          platform,
          scheduledAt: scheduledAt.toISOString(),
        }).then((result) => {
          if (!result.ok) {
            setMessage({ kind: "error", text: result.error });
            return;
          }

          setMessage({
            kind: "success",
            text: "Content added to calendar.",
          });
          router.refresh();
        });
      });
    };
  }

  function handleExport(slotId: string) {
    startTransition(() => {
      void exportCalendarSlotAction(slotId).then(async (result) => {
        if (!result.ok) {
          setMessage({ kind: "error", text: result.error });
          return;
        }

        const { copyText, destinationUrl, caption, hashtags } = result.data;
        const copied = await copyToClipboard(copyText);

        startDownload(result.data.downloadUrl, result.data.fileName);
        setLatestExport({
          copyText,
          destinationUrl,
          caption,
          hashtags,
        });
        setMessage({
          kind: copied ? "success" : "error",
          text: copied
            ? "Export ready. Caption copied."
            : "Export ready. Copy text is shown below.",
        });
        router.refresh();
      });
    });
  }

  function handleMarkPosted(slotId: string) {
    startTransition(() => {
      void markCalendarSlotPostedAction(slotId).then((result) => {
        if (!result.ok) {
          setMessage({ kind: "error", text: result.error });
          return;
        }

        setMessage({ kind: "success", text: "Slot marked posted." });
        router.refresh();
      });
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1500px] gap-0 lg:grid-cols-[340px_1fr]">
        <aside className="border-b bg-muted/30 px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase text-muted-foreground">
                Calendar
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                {workspace?.name ?? "Fixture calendar"}
              </h1>
            </div>
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CalendarDays className="size-5" aria-hidden="true" />
            </div>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}

          {!workspace && !loadError ? (
            <div className="mt-5 rounded-md border bg-background p-4 text-sm text-muted-foreground">
              No fixture workspace found. Run{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                pnpm tsx scripts/seed-calendar-fixtures.ts
              </code>
              .
            </div>
          ) : null}

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                Saved content
              </h2>
              <Badge variant="outline">{contentItems.length}</Badge>
            </div>

            <div className="grid max-h-[calc(100vh-220px)] gap-3 overflow-y-auto pr-1">
              {contentItems.map((item) => (
                <article
                  aria-label={`${item.hook} saved content`}
                  className="cursor-grab rounded-md border bg-card p-3 text-card-foreground shadow-sm transition hover:border-primary/30 active:cursor-grabbing"
                  data-calendar-content-item-id={item.id}
                  draggable
                  key={item.id}
                  onDragStart={(event) => handleDragStart(event, item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-foreground">
                        <Film className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.hook}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {contentFormatLabels[item.format]}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.renderStatus === "rendered" ? "success" : "muted"
                      }
                    >
                      {item.renderStatus}
                    </Badge>
                  </div>
                  {item.preview ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {item.preview}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.hashtags.slice(0, 3).map((hashtag) => (
                      <span
                        className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        key={hashtag}
                      >
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {formatRangeLabel(anchorDate, view)}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                Publishing calendar
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                aria-label="Previous range"
                onClick={() => shiftDate(-1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button onClick={goToToday} variant="outline">
                Today
              </Button>
              <Button
                aria-label="Next range"
                onClick={() => shiftDate(1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
              <div className="ml-0 flex rounded-md border bg-background p-1 sm:ml-2">
                <Button
                  aria-pressed={view === "week"}
                  onClick={() => setView("week")}
                  size="sm"
                  variant={view === "week" ? "default" : "ghost"}
                >
                  <Rows3 aria-hidden="true" />
                  Week
                </Button>
                <Button
                  aria-pressed={view === "month"}
                  onClick={() => setView("month")}
                  size="sm"
                  variant={view === "month" ? "default" : "ghost"}
                >
                  <Grid3X3 aria-hidden="true" />
                  Month
                </Button>
              </div>
            </div>
          </div>

          {message ? (
            <div
              className={cn(
                "mt-4 rounded-md border px-3 py-2 text-sm",
                message.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {message.text}
            </div>
          ) : null}

          {latestExport ? (
            <div className="mt-4 rounded-md border bg-muted/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Latest export</p>
                  <p className="text-xs text-muted-foreground">
                    {latestExport.destinationUrl}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    void copyToClipboard(latestExport.copyText).then(
                      (copied) => {
                        setMessage({
                          kind: copied ? "success" : "error",
                          text: copied
                            ? "Caption copied."
                            : "Copy failed. Select the text manually.",
                        });
                      },
                    );
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Clipboard aria-hidden="true" />
                  Copy
                </Button>
              </div>
              <textarea
                className="mt-3 h-28 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                readOnly
                value={latestExport.copyText}
              />
            </div>
          ) : null}

          <div className="mt-5">
            {view === "week" ? (
              <WeekView
                activeDropKey={activeDropKey}
                days={visibleDays}
                disabled={isPending || !workspace}
                onDragEnter={setActiveDropKey}
                onDrop={handleDrop}
                onExport={handleExport}
                onMarkPosted={handleMarkPosted}
                slotsByKey={slotsByKey}
              />
            ) : (
              <MonthView
                activeDate={anchorDate}
                activeDropKey={activeDropKey}
                days={visibleDays}
                disabled={isPending || !workspace}
                onDragEnter={setActiveDropKey}
                onDrop={handleDrop}
                onExport={handleExport}
                onMarkPosted={handleMarkPosted}
                slotsByKey={slotsByKey}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type CalendarGridProps = {
  activeDropKey: string | null;
  disabled: boolean;
  onDragEnter: (key: string | null) => void;
  onDrop: (
    day: Date,
    platform: PublishingPlatform,
  ) => (event: React.DragEvent<HTMLDivElement>) => void;
  onExport: (slotId: string) => void;
  onMarkPosted: (slotId: string) => void;
  slotsByKey: Map<string, CalendarSlot[]>;
};

function WeekView({
  activeDropKey,
  days,
  disabled,
  onDragEnter,
  onDrop,
  onExport,
  onMarkPosted,
  slotsByKey,
}: CalendarGridProps & { days: Date[] }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <div className="grid min-w-[1040px] grid-cols-[112px_repeat(7,minmax(126px,1fr))]">
        <div className="border-b border-r bg-muted/50 p-3" />
        {days.map((day) => (
          <div
            className="border-b border-r bg-muted/50 p-3"
            key={day.toISOString()}
          >
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {weekDayNames[day.getDay()]}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-semibold",
                isSameDay(day, new Date()) ? "text-accent-foreground" : "",
              )}
            >
              {day.getDate()}
            </p>
          </div>
        ))}

        {publishingPlatforms.map((platform) => (
          <React.Fragment key={platform.value}>
            <div className="border-r border-t bg-muted/30 p-3">
              <Badge variant="outline">{platform.tag}</Badge>
              <p className="mt-2 text-sm font-medium">{platform.shortLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatHour(platformHours[platform.value])}
              </p>
            </div>
            {days.map((day) => {
              const key = getDropKey(day, platform.value);

              return (
                <DropCell
                  active={activeDropKey === key}
                  compact={false}
                  day={day}
                  disabled={disabled}
                  key={key}
                  onDragEnter={() => onDragEnter(key)}
                  onDragLeave={() => onDragEnter(null)}
                  onDrop={onDrop(day, platform.value)}
                  onExport={onExport}
                  onMarkPosted={onMarkPosted}
                  platform={platform.value}
                  slots={slotsByKey.get(key) ?? []}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MonthView({
  activeDate,
  activeDropKey,
  days,
  disabled,
  onDragEnter,
  onDrop,
  onExport,
  onMarkPosted,
  slotsByKey,
}: CalendarGridProps & { activeDate: Date; days: Date[] }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <div className="grid min-w-[980px] grid-cols-7">
        {weekDayNames.map((dayName) => (
          <div
            className="border-b border-r bg-muted/50 p-3 text-xs font-medium uppercase text-muted-foreground"
            key={dayName}
          >
            {dayName}
          </div>
        ))}
        {days.map((day) => (
          <div
            className={cn(
              "min-h-[220px] border-r border-t p-2",
              day.getMonth() === activeDate.getMonth()
                ? "bg-background"
                : "bg-muted/20 text-muted-foreground",
            )}
            key={day.toISOString()}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-sm font-medium",
                  isSameDay(day, new Date())
                    ? "bg-primary text-primary-foreground"
                    : "",
                )}
              >
                {day.getDate()}
              </span>
            </div>
            <div className="mt-2 grid gap-2">
              {publishingPlatforms.map((platform) => {
                const key = getDropKey(day, platform.value);

                return (
                  <DropCell
                    active={activeDropKey === key}
                    compact
                    day={day}
                    disabled={disabled}
                    key={key}
                    onDragEnter={() => onDragEnter(key)}
                    onDragLeave={() => onDragEnter(null)}
                    onDrop={onDrop(day, platform.value)}
                    onExport={onExport}
                    onMarkPosted={onMarkPosted}
                    platform={platform.value}
                    slots={slotsByKey.get(key) ?? []}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type DropCellProps = {
  active: boolean;
  compact: boolean;
  day: Date;
  disabled: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onExport: (slotId: string) => void;
  onMarkPosted: (slotId: string) => void;
  platform: PublishingPlatform;
  slots: CalendarSlot[];
};

function DropCell({
  active,
  compact,
  day,
  disabled,
  onDragEnter,
  onDragLeave,
  onDrop,
  onExport,
  onMarkPosted,
  platform,
  slots,
}: DropCellProps) {
  const option = getPlatformOption(platform);

  return (
    <div
      aria-label={`Schedule ${option.label} content on ${formatDateForA11y(day)}`}
      className={cn(
        "min-h-[132px] border-r border-t p-2 transition-colors",
        compact && "min-h-[56px] rounded-md border p-1.5",
        active ? "bg-accent/10 ring-2 ring-inset ring-ring" : "bg-background",
        disabled && "opacity-60",
      )}
      data-calendar-drop-cell=""
      data-date={toDateKey(day)}
      data-platform={platform}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          onDragEnter();
        }
      }}
      onDragLeave={onDragLeave}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (!disabled) {
          onDrop(event);
        }
      }}
    >
      {compact ? (
        <div className="mb-1 flex items-center justify-between gap-1">
          <Badge className="px-1.5" variant="muted">
            {option.tag}
          </Badge>
          <span className="text-xs text-muted-foreground">{slots.length}</span>
        </div>
      ) : null}

      <div className="grid gap-2">
        {slots.map((slot) => (
          <SlotCard
            compact={compact}
            key={slot.id}
            onExport={onExport}
            onMarkPosted={onMarkPosted}
            slot={slot}
          />
        ))}
        {slots.length === 0 ? (
          <div
            className={cn(
              "flex min-h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground",
              compact && "min-h-10",
            )}
          >
            Empty
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatDateForA11y(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SlotCard({
  compact,
  onExport,
  onMarkPosted,
  slot,
}: {
  compact: boolean;
  onExport: (slotId: string) => void;
  onMarkPosted: (slotId: string) => void;
  slot: CalendarSlot;
}) {
  const platform = getPlatformOption(slot.platform);
  const isPosted = slot.status === "posted_manual";

  return (
    <article className="rounded-md border bg-card p-2 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{platform.tag}</Badge>
        <Badge
          variant={
            isPosted
              ? "success"
              : slot.status === "exported"
                ? "warning"
                : "muted"
          }
        >
          {slotStatusLabels[slot.status]}
        </Badge>
      </div>
      <p
        className={cn(
          "mt-2 font-medium leading-5",
          compact ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm",
        )}
      >
        {slot.item.hook}
      </p>
      {!compact ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTime(new Date(slot.scheduledAt))}
        </p>
      ) : null}
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button
            disabled={isPosted}
            onClick={() => onExport(slot.id)}
            size="sm"
            variant="outline"
          >
            <Download aria-hidden="true" />
            Export
          </Button>
          <Button
            disabled={slot.status !== "exported"}
            onClick={() => onMarkPosted(slot.id)}
            size="sm"
            variant="outline"
          >
            {isPosted ? (
              <Check aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            Posted
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function getDropKey(day: Date, platform: PublishingPlatform) {
  return `${toDateKey(day)}:${platform}`;
}

function getScheduledDateForPlatform(day: Date, platform: PublishingPlatform) {
  const date = new Date(day);
  date.setHours(platformHours[platform], 0, 0, 0);
  return date;
}

function getWeekDays(anchorDate: Date) {
  const start = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_value, index) => addDays(start, index));
}

function getMonthGridDays(anchorDate: Date) {
  const firstOfMonth = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    1,
  );
  const start = startOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_value, index) => addDays(start, index));
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function isSameDay(first: Date, second: Date) {
  return toDateKey(first) === toDateKey(second);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatRangeLabel(anchorDate: Date, view: CalendarView) {
  if (view === "month") {
    return anchorDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  const days = getWeekDays(anchorDate);
  const first = days[0];
  const last = days[days.length - 1];
  return `${first.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHour(hour: number) {
  return new Date(2026, 0, 1, hour, 0, 0).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyToClipboard(text);
    }
  }

  return fallbackCopyToClipboard(text);
}

function fallbackCopyToClipboard(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function startDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
