import { Readable } from "node:stream";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarSlots, contentItems } from "@/lib/db/schema";
import {
  createVideoStorageFromEnv,
  VideoStorageInvalidKeyError,
  VideoStorageNotFoundError,
} from "@/lib/storage/video-storage";
import { isUserWorkspaceMember } from "@/lib/workspaces";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slotId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return new Response("Unauthorized.", { status: 401 });
  }

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

  const isMember = await isUserWorkspaceMember({
    userId: session.user.id,
    workspaceId: row.item.workspaceId,
  });

  if (!isMember) {
    return new Response("Forbidden.", { status: 403 });
  }

  const fileName = `fastlane-${row.slot.platform}-${row.item.id.slice(0, 8)}.mp4`;
  const dataUrlResponse = responseFromDataUrl(row.item.videoUrl, fileName);

  if (dataUrlResponse) {
    return dataUrlResponse;
  }

  const storageKey = storageKeyFromApiVideoUrl(row.item.videoUrl);

  if (storageKey) {
    const storageWorkspaceId = workspaceIdFromStorageKey(storageKey);

    if (storageWorkspaceId !== row.item.workspaceId) {
      return new Response("Forbidden.", { status: 403 });
    }

    return responseFromStorage(storageKey, fileName);
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

async function responseFromStorage(key: string, fileName: string) {
  const storage = createVideoStorageFromEnv();

  try {
    const video = await storage.getStream(key);

    return new Response(readableToResponseBody(video.stream), {
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Disposition": attachmentHeader(fileName),
        "Content-Length": String(video.contentLength),
        "Content-Type": "video/mp4",
      },
      status: 200,
    });
  } catch (error) {
    if (
      error instanceof VideoStorageNotFoundError ||
      error instanceof VideoStorageInvalidKeyError
    ) {
      return new Response("Video not found.", { status: 404 });
    }

    throw error;
  }
}

function storageKeyFromApiVideoUrl(videoUrl: string) {
  const prefix = "/api/videos/";

  if (!videoUrl.startsWith(prefix)) {
    return null;
  }

  try {
    const url = new URL(videoUrl, "http://fastlane.local");

    if (!url.pathname.startsWith(prefix)) {
      return null;
    }

    return url.pathname
      .slice(prefix.length)
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }
}

function workspaceIdFromStorageKey(key: string) {
  const segments = key.split("/");

  if (
    segments.length < 4 ||
    segments[0] !== "renders" ||
    segments[1].length === 0 ||
    segments[2].length === 0
  ) {
    return null;
  }

  return segments[1];
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

function readableToResponseBody(stream: Readable) {
  return Readable.toWeb(stream) as unknown as BodyInit;
}
