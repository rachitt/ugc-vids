import "dotenv/config";

import { db, pool } from "../src/lib/db/index";
import { humanUgcClips } from "../src/lib/db/schema";
import { manifest } from "../src/lib/assets/manifest";

const clipSeeds = manifest.ugcClips.map((clip) => ({
  clipUrl: `asset:${clip.id}`,
  genderTags: [clip.gender],
  styleTags: [clip.role, ...clip.tags],
}));

async function main() {
  const existingRows = await db
    .select({ clipUrl: humanUgcClips.clipUrl })
    .from(humanUgcClips);
  const existingUrls = new Set(existingRows.map((clip) => clip.clipUrl));
  const rowsToInsert = clipSeeds.filter(
    (clip) => !existingUrls.has(clip.clipUrl),
  );

  if (rowsToInsert.length > 0) {
    await db.insert(humanUgcClips).values(rowsToInsert);
  }

  console.log(
    `Seeded ${rowsToInsert.length} human UGC clips (${clipSeeds.length} total seeds).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
