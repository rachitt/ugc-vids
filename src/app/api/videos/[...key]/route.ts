import { Readable } from "node:stream";

import { auth } from "@/lib/auth";
import {
  createVideoStorageFromEnv,
  normalizeVideoStorageKey,
  VideoStorageInvalidKeyError,
  VideoStorageNotFoundError,
  VideoStorageRangeNotSatisfiableError,
  type StoredVideoStream,
  type VideoByteRange,
} from "@/lib/storage/video-storage";
import { isUserWorkspaceMember } from "@/lib/workspaces";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const params = await context.params;
  const key = normalizeRouteKey(params.key);

  if (!key) {
    return new Response("Video not found.", { status: 404 });
  }

  const workspaceId = workspaceIdFromKey(key);

  if (!workspaceId) {
    return new Response("Video not found.", { status: 404 });
  }

  const isMember = await isUserWorkspaceMember({
    userId: session.user.id,
    workspaceId,
  });

  if (!isMember) {
    return new Response("Forbidden.", { status: 403 });
  }

  const storage = createVideoStorageFromEnv();

  try {
    const stat = await storage.stat(key);

    if (!stat) {
      return new Response("Video not found.", { status: 404 });
    }

    const range = parseRangeHeader(request.headers.get("range"), stat.size);

    if (range instanceof Response) {
      return range;
    }

    const video = await storage.getStream(key, range);

    return new Response(readableToResponseBody(video.stream), {
      headers: responseHeaders(video),
      status: video.range ? 206 : 200,
    });
  } catch (error) {
    if (
      error instanceof VideoStorageNotFoundError ||
      error instanceof VideoStorageInvalidKeyError
    ) {
      return new Response("Video not found.", { status: 404 });
    }

    if (error instanceof VideoStorageRangeNotSatisfiableError) {
      return rangeNotSatisfiable(error.size);
    }

    throw error;
  }
}

function normalizeRouteKey(segments: string[]) {
  try {
    return normalizeVideoStorageKey(segments.join("/"));
  } catch {
    return null;
  }
}

function workspaceIdFromKey(key: string) {
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

function parseRangeHeader(
  header: string | null,
  size: number,
): Response | VideoByteRange | undefined {
  if (!header) {
    return undefined;
  }

  if (size === 0) {
    return rangeNotSatisfiable(size);
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());

  if (!match) {
    return rangeNotSatisfiable(size);
  }

  const [, rawStart, rawEnd] = match;

  if (!rawStart && !rawEnd) {
    return rangeNotSatisfiable(size);
  }

  if (!rawStart) {
    const suffixLength = Number(rawEnd);

    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return rangeNotSatisfiable(size);
    }

    return {
      end: size - 1,
      start: Math.max(size - suffixLength, 0),
    };
  }

  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : size - 1;

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start > end ||
    start >= size
  ) {
    return rangeNotSatisfiable(size);
  }

  return {
    end: Math.min(end, size - 1),
    start,
  };
}

function responseHeaders(video: StoredVideoStream) {
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Length": String(video.contentLength),
    "Content-Type": "video/mp4",
  });

  if (video.range) {
    headers.set(
      "Content-Range",
      `bytes ${video.range.start}-${video.range.end}/${video.size}`,
    );
  }

  return headers;
}

function rangeNotSatisfiable(size: number) {
  return new Response(null, {
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes */${size}`,
    },
    status: 416,
  });
}

function readableToResponseBody(stream: Readable) {
  return Readable.toWeb(stream) as unknown as BodyInit;
}
