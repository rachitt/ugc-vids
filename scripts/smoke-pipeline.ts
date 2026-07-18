import { eq } from "drizzle-orm";

import { analyzeBrandProfile } from "../src/lib/brand/analysis";
import { scrapeBrandWebsite } from "../src/lib/brand/scraper";
import { generateMixedContentBatch } from "../src/lib/content/batch";
import { db } from "../src/lib/db";
import { brandProfiles, contentItems } from "../src/lib/db/schema";
import { getOrCreateDefaultWorkspace } from "../src/lib/workspaces";

async function main() {
  const url = process.argv[2] ?? "https://cal.com";
  const workspace = await getOrCreateDefaultWorkspace();
  console.log("workspace", workspace.id);

  const scrape = await scrapeBrandWebsite(url);
  console.log(
    "scraped pages:",
    scrape.pages.map((p) => p.url),
  );

  const analysis = await analyzeBrandProfile(scrape);
  console.log("tone:", analysis.tone);
  console.log("niche tags:", analysis.nicheTags);
  console.log("hook angles:", analysis.hookAngles.length);

  const [profile] = await db
    .insert(brandProfiles)
    .values({
      workspaceId: workspace.id,
      url: scrape.rootUrl,
      scrapedSummary: scrape.pages[0]?.text.slice(0, 2000) ?? null,
      productDesc: analysis.productDescription,
      audience: analysis.audience,
      tone: analysis.tone,
      nicheTags: analysis.nicheTags,
      painPoints: analysis.painPoints,
      hookAngles: analysis.hookAngles,
    })
    .returning();
  console.log("brand profile", profile.id);

  const batch = await generateMixedContentBatch({
    brandProfileId: profile.id,
    totalCount: 4,
    workspaceId: workspace.id,
  });
  console.log("generated:", batch.items.length, "errors:", batch.errors.length);
  for (const err of batch.errors) {
    console.log("ERROR", err.format, err.message);
  }
  for (const item of batch.items) {
    const [row] = await db
      .select({
        format: contentItems.format,
        status: contentItems.status,
      })
      .from(contentItems)
      .where(eq(contentItems.id, item.id));
    console.log("ITEM", item.id, row?.format, row?.status);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
