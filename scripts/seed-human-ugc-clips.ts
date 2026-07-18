import "dotenv/config";

import { db, pool } from "../src/lib/db/index";
import { humanUgcClips } from "../src/lib/db/schema";
import { createClipPlaceholderDataUri } from "../src/lib/avatars/placeholders";

const clipSeeds = [
  {
    title: "Desk review hook",
    styleTags: ["desk_review", "hook"],
    genderTags: ["woman"],
  },
  {
    title: "Street reaction",
    styleTags: ["street_interview", "reaction"],
    genderTags: ["man"],
  },
  {
    title: "Product unboxing",
    styleTags: ["unboxing", "product_demo"],
    genderTags: ["woman"],
  },
  {
    title: "Over shoulder demo",
    styleTags: ["product_demo", "screen_demo"],
    genderTags: ["nonbinary"],
  },
  {
    title: "Kitchen lifestyle",
    styleTags: ["lifestyle", "home"],
    genderTags: ["woman"],
  },
  {
    title: "Gym testimonial",
    styleTags: ["testimonial", "fitness"],
    genderTags: ["man"],
  },
  {
    title: "Mirror outfit check",
    styleTags: ["fashion", "lifestyle"],
    genderTags: ["woman"],
  },
  {
    title: "Founder selfie",
    styleTags: ["direct_to_camera", "founder"],
    genderTags: ["nonbinary"],
  },
  {
    title: "Cafe product chat",
    styleTags: ["lifestyle", "testimonial"],
    genderTags: ["man"],
  },
  {
    title: "Phone app demo",
    styleTags: ["product_demo", "mobile_app"],
    genderTags: ["woman"],
  },
  {
    title: "Greenscreen explainer",
    styleTags: ["greenscreen", "explainer"],
    genderTags: ["nonbinary"],
  },
  {
    title: "Creator reaction cut",
    styleTags: ["reaction", "creator"],
    genderTags: ["woman"],
  },
];

async function main() {
  const seededClipUrls = clipSeeds.map((clip) =>
    createClipPlaceholderDataUri({
      name: clip.title,
      label: [...clip.styleTags, ...clip.genderTags].join(" / "),
      seed: `${clip.title}:${clip.styleTags.join(",")}`,
    }),
  );
  const existingRows = await db
    .select({ clipUrl: humanUgcClips.clipUrl })
    .from(humanUgcClips);
  const existingUrls = new Set(existingRows.map((clip) => clip.clipUrl));
  const rowsToInsert = clipSeeds
    .map((clip, index) => ({
      clipUrl: seededClipUrls[index],
      styleTags: clip.styleTags,
      genderTags: clip.genderTags,
    }))
    .filter((clip) => !existingUrls.has(clip.clipUrl));

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
