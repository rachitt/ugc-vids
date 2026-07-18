import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import {
  isUuid,
  normalizeWorkspacePublicKey,
} from "@/lib/analytics/workspace-key";
import { db } from "@/lib/db";
import { contentItems, siteEvents, workspaces } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "Content-Type, X-Fastlane-Workspace-Key, X-Requested-With",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request);

  if (!payload) {
    return jsonError("Invalid JSON payload", 400);
  }

  const workspaceId = normalizeWorkspacePublicKey(
    payload.workspaceKey ??
      payload.workspace_public_key ??
      request.headers.get("x-fastlane-workspace-key"),
  );

  if (!workspaceId) {
    return jsonError("A valid workspace public key is required", 400);
  }

  const eventName = readText(payload.eventName ?? payload.event_name, 80);
  const url = readText(payload.url, 2048);

  if (!eventName || !url) {
    return jsonError("eventName and url are required", 400);
  }

  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return jsonError("Unknown workspace public key", 404);
  }

  const utmContent = readText(payload.utmContent ?? payload.utm_content, 128);
  const contentItemId = await resolveContentItemId(workspaceId, utmContent);

  await db.insert(siteEvents).values({
    workspaceId,
    contentItemId,
    visitorId: readText(payload.visitorId ?? payload.visitor_id, 128),
    eventName,
    url,
    referrer: readText(payload.referrer, 2048),
    utmSource: readText(payload.utmSource ?? payload.utm_source, 128),
    utmContent,
    metadata: sanitizeMetadata(payload.metadata),
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: corsHeaders,
      status: 201,
    },
  );
}

async function readPayload(request: NextRequest) {
  try {
    const text = await request.text();

    if (!text.trim()) {
      return null;
    }

    const parsed = JSON.parse(text) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function resolveContentItemId(
  workspaceId: string,
  utmContent: string | null,
) {
  if (!utmContent || !isUuid(utmContent)) {
    return null;
  }

  const [contentItem] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.id, utmContent),
        eq(contentItems.workspaceId, workspaceId),
      ),
    )
    .limit(1);

  return contentItem?.id ?? null;
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function sanitizeMetadata(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  try {
    JSON.stringify(value);
    return value;
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      headers: corsHeaders,
      status,
    },
  );
}
