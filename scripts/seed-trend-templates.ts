#!/usr/bin/env tsx
import { createHash } from "node:crypto";

import { config } from "dotenv";
import { inArray, sql } from "drizzle-orm";

import { trendTemplates } from "../src/lib/db/schema";
import { stringifyTrendTemplateMetadata } from "../src/lib/trends/metadata";
import { curatedTrendTemplates } from "../src/lib/trends/seed-data";

config();

function uuidFromSeed(seed: string): string {
  const bytes = createHash("sha256")
    .update(`fastlane:trend-template:${seed}`)
    .digest();

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.subarray(0, 16).toString("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

async function main() {
  const { db, pool } = await import("../src/lib/db/index");

  try {
    const now = new Date();
    const rows = curatedTrendTemplates.map((template) => ({
      engagementNotes: template.engagementNotes,
      exampleRef: stringifyTrendTemplateMetadata({
        promptRecipe: template.promptRecipe,
        seedVersion: "phase-5-v1",
        sourcePattern: template.sourcePattern,
      }),
      id: uuidFromSeed(template.slug),
      nicheTags: template.nicheTags,
      remotionTemplateId: template.remotionTemplateId,
      structureDescription: template.structureDescription,
      title: template.title,
      updatedAt: now,
    }));

    for (const row of rows) {
      await db
        .insert(trendTemplates)
        .values(row)
        .onConflictDoUpdate({
          set: {
            engagementNotes: row.engagementNotes,
            exampleRef: row.exampleRef,
            nicheTags: row.nicheTags,
            remotionTemplateId: row.remotionTemplateId,
            structureDescription: row.structureDescription,
            title: row.title,
            updatedAt: row.updatedAt,
          },
          target: trendTemplates.id,
        });
    }

    const ids = rows.map((row) => row.id);
    const [countRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(trendTemplates)
      .where(inArray(trendTemplates.id, ids));

    console.log(
      `Seeded ${countRow?.count ?? 0}/${rows.length} curated trend templates.`,
    );
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
