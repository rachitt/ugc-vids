import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { generateMixedContentBatch } from "@/lib/content/batch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const workspaceId = getString(body.workspaceId);
  const brandProfileId = getString(body.brandProfileId);

  if (!workspaceId || !brandProfileId) {
    return NextResponse.json(
      { error: "workspaceId and brandProfileId are required." },
      { status: 400 },
    );
  }

  try {
    const result = await generateMixedContentBatch({
      brandProfileId,
      totalCount: getNumber(body.totalCount) ?? 12,
      workspaceId,
    });

    revalidatePath("/content");

    return NextResponse.json(result, {
      status: result.generatedCount > 0 ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getNumber(value: unknown) {
  if (typeof value !== "number") {
    return undefined;
  }

  return Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Content generation failed.";
}
