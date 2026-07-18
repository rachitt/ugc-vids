import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { calendarSlots, contentItems } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slotId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slotId } = await context.params;
  const [row] = await db
    .select({
      slot: calendarSlots,
      item: contentItems,
    })
    .from(calendarSlots)
    .innerJoin(contentItems, eq(calendarSlots.contentItemId, contentItems.id))
    .where(eq(calendarSlots.id, slotId))
    .limit(1);

  if (!row?.item.videoUrl) {
    return new Response("Video not found.", { status: 404 });
  }

  const fileName = `fastlane-${row.slot.platform}-${row.item.id.slice(0, 8)}.mp4`;
  const dataUrlResponse = responseFromDataUrl(row.item.videoUrl, fileName);

  if (dataUrlResponse) {
    return dataUrlResponse;
  }

  let sourceUrl: URL;

  try {
    sourceUrl = new URL(row.item.videoUrl, request.url);
  } catch {
    return new Response("Invalid video_url.", { status: 400 });
  }

  if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
    return new Response("Unsupported video_url protocol.", { status: 400 });
  }

  try {
    const videoResponse = await fetch(sourceUrl, { cache: "no-store" });

    if (!videoResponse.ok || !videoResponse.body) {
      return Response.redirect(sourceUrl, 302);
    }

    const headers = new Headers(videoResponse.headers);
    headers.set("Content-Disposition", attachmentHeader(fileName));
    headers.set(
      "Content-Type",
      videoResponse.headers.get("Content-Type") ?? "video/mp4",
    );

    return new Response(videoResponse.body, {
      headers,
      status: 200,
    });
  } catch {
    return Response.redirect(sourceUrl, 302);
  }
}

function responseFromDataUrl(dataUrl: string, fileName: string) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);

  if (!match) {
    return null;
  }

  const contentType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  const body = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return new Response(body, {
    headers: {
      "Content-Disposition": attachmentHeader(fileName),
      "Content-Length": String(body.byteLength),
      "Content-Type": contentType,
    },
  });
}

function attachmentHeader(fileName: string) {
  return `attachment; filename="${fileName.replace(/["\\]/g, "")}"`;
}
