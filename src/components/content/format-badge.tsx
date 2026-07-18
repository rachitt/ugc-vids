import type { ContentFormat } from "@/lib/content/types";
import { getContentFormatLabel } from "@/lib/content/display";
import { cn } from "@/lib/utils";

type FormatBadgeProps = {
  format: ContentFormat;
  className?: string;
};

export function FormatBadge({ className, format }: FormatBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {getContentFormatLabel(format)}
    </span>
  );
}
