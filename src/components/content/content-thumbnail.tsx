import { Film } from "lucide-react";

import type { ContentFormat } from "@/lib/content/types";
import { getContentInitials } from "@/lib/content/display";
import { cn } from "@/lib/utils";

type ContentThumbnailProps = {
  format: ContentFormat;
  thumbUrl?: string | null;
  className?: string;
};

const placeholderStyles: Record<ContentFormat, string> = {
  avatar_ugc: "from-cyan-100 via-slate-100 to-emerald-100",
  greenscreen_meme: "from-lime-100 via-slate-100 to-sky-100",
  hook_demo: "from-amber-100 via-slate-100 to-rose-100",
  slideshow: "from-sky-100 via-white to-emerald-100",
  wall_of_text: "from-zinc-100 via-white to-cyan-100",
};

export function ContentThumbnail({
  className,
  format,
  thumbUrl,
}: ContentThumbnailProps) {
  if (thumbUrl) {
    return (
      <div
        aria-label="Content thumbnail"
        className={cn(
          "aspect-[9/16] overflow-hidden rounded-lg border bg-cover bg-center",
          className,
        )}
        style={{ backgroundImage: `url(${thumbUrl})` }}
      />
    );
  }

  return (
    <div
      aria-label="Generated thumbnail placeholder"
      className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-lg border bg-gradient-to-br",
        placeholderStyles[format],
        className,
      )}
    >
      <div className="absolute inset-x-4 top-5 h-16 rounded-md border bg-white/70" />
      <div className="absolute inset-x-5 top-28 space-y-2">
        <div className="h-3 rounded-full bg-slate-900/70" />
        <div className="h-3 w-4/5 rounded-full bg-slate-900/45" />
        <div className="h-3 w-2/3 rounded-full bg-slate-900/30" />
      </div>
      <div className="absolute bottom-5 left-5 flex size-12 items-center justify-center rounded-md bg-slate-950 text-white">
        <Film className="size-5" aria-hidden="true" />
      </div>
      <div className="absolute bottom-5 right-5 rounded-md bg-white/80 px-2 py-1 text-xs font-semibold text-slate-800">
        {getContentInitials(format)}
      </div>
    </div>
  );
}
