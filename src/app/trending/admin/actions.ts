"use server";

import { eq } from "drizzle-orm";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { trendTemplates } from "@/lib/db/schema";
import {
  createFallbackPromptRecipe,
  parseTrendTemplateMetadata,
  stringifyTrendTemplateMetadata,
  type PromptRecipe,
} from "@/lib/trends/metadata";
import { normalizeRemotionTemplateId } from "@/lib/trends/queries";

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseNicheTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parsePromptRecipeField(
  value: string,
  title: string,
  structureDescription: string,
): PromptRecipe {
  if (!value) {
    return createFallbackPromptRecipe(title, structureDescription);
  }

  const parsed: unknown = JSON.parse(value);
  const metadata = parseTrendTemplateMetadata(
    JSON.stringify({
      promptRecipe: parsed,
      sourcePattern: "admin-entered",
    }),
  );

  if (!metadata) {
    throw new Error(
      "Prompt recipe must be valid JSON with the required fields.",
    );
  }

  return metadata.promptRecipe;
}

function readTemplateForm(formData: FormData) {
  const title = readText(formData, "title");
  const structureDescription = readText(formData, "structureDescription");
  const engagementNotes = readText(formData, "engagementNotes");
  const nicheTags = parseNicheTags(readText(formData, "nicheTags"));
  const remotionTemplateId = normalizeRemotionTemplateId(
    readText(formData, "remotionTemplateId"),
  );

  if (!title) {
    throw new Error("Trend template name is required.");
  }

  if (!structureDescription) {
    throw new Error("Structure description is required.");
  }

  if (!remotionTemplateId) {
    throw new Error("Choose a supported Remotion template format.");
  }

  const promptRecipe = parsePromptRecipeField(
    readText(formData, "promptRecipe"),
    title,
    structureDescription,
  );

  return {
    engagementNotes,
    exampleRef: stringifyTrendTemplateMetadata({
      promptRecipe,
      sourcePattern: "admin-entered",
      updatedBy: "trending-admin",
    }),
    nicheTags,
    remotionTemplateId,
    structureDescription,
    title,
    updatedAt: new Date(),
  };
}

export async function createTrendTemplateAction(formData: FormData) {
  const values = readTemplateForm(formData);

  await db.insert(trendTemplates).values(values);

  revalidatePath("/trending");
  revalidatePath("/trending/admin");
  redirect("/trending/admin" as Route);
}

export async function updateTrendTemplateAction(formData: FormData) {
  const id = readText(formData, "id");

  if (!id) {
    throw new Error("Trend template id is required.");
  }

  const values = readTemplateForm(formData);

  await db.update(trendTemplates).set(values).where(eq(trendTemplates.id, id));

  revalidatePath("/trending");
  revalidatePath("/trending/admin");
  redirect("/trending/admin" as Route);
}
