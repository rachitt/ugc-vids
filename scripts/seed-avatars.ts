import "dotenv/config";

import { eq } from "drizzle-orm";

import { db, pool } from "../src/lib/db/index";
import { avatars } from "../src/lib/db/schema";
import { createPortraitPlaceholderDataUri } from "../src/lib/avatars/placeholders";

const libraryAvatarSeeds = [
  {
    name: "Ari Kim",
    persona: "founder",
    gender: "woman",
    ageRange: "25-34",
    style: "direct_to_camera",
    toneTags: ["confident", "warm"],
    nicheTags: ["saas", "productivity"],
  },
  {
    name: "Marcus Reed",
    persona: "expert",
    gender: "man",
    ageRange: "35-44",
    style: "desk_review",
    toneTags: ["credible", "practical"],
    nicheTags: ["finance", "b2b"],
  },
  {
    name: "Nia Brooks",
    persona: "creator",
    gender: "woman",
    ageRange: "18-24",
    style: "lifestyle",
    toneTags: ["playful", "fast"],
    nicheTags: ["fashion", "beauty"],
  },
  {
    name: "Theo Patel",
    persona: "reviewer",
    gender: "man",
    ageRange: "25-34",
    style: "product_demo",
    toneTags: ["clear", "skeptical"],
    nicheTags: ["ecommerce", "tech"],
  },
  {
    name: "Elena Soto",
    persona: "coach",
    gender: "woman",
    ageRange: "35-44",
    style: "greenscreen",
    toneTags: ["direct", "encouraging"],
    nicheTags: ["wellness", "fitness"],
  },
  {
    name: "Jordan Vale",
    persona: "consumer",
    gender: "nonbinary",
    ageRange: "25-34",
    style: "street_interview",
    toneTags: ["candid", "curious"],
    nicheTags: ["food", "travel"],
  },
  {
    name: "Mina Laurent",
    persona: "expert",
    gender: "woman",
    ageRange: "45-54",
    style: "desk_review",
    toneTags: ["calm", "analytical"],
    nicheTags: ["education", "career"],
  },
  {
    name: "Caleb Stone",
    persona: "founder",
    gender: "man",
    ageRange: "25-34",
    style: "direct_to_camera",
    toneTags: ["scrappy", "honest"],
    nicheTags: ["startup", "saas"],
  },
  {
    name: "Priya Shah",
    persona: "creator",
    gender: "woman",
    ageRange: "25-34",
    style: "product_demo",
    toneTags: ["polished", "friendly"],
    nicheTags: ["home", "ecommerce"],
  },
  {
    name: "Dante Moore",
    persona: "coach",
    gender: "man",
    ageRange: "35-44",
    style: "greenscreen",
    toneTags: ["energetic", "tactical"],
    nicheTags: ["fitness", "nutrition"],
  },
  {
    name: "Sasha Nguyen",
    persona: "reviewer",
    gender: "nonbinary",
    ageRange: "18-24",
    style: "lifestyle",
    toneTags: ["witty", "sharp"],
    nicheTags: ["gaming", "tech"],
  },
  {
    name: "Helena Park",
    persona: "consumer",
    gender: "woman",
    ageRange: "35-44",
    style: "street_interview",
    toneTags: ["relatable", "warm"],
    nicheTags: ["parenting", "home"],
  },
  {
    name: "Owen Blake",
    persona: "expert",
    gender: "man",
    ageRange: "45-54",
    style: "direct_to_camera",
    toneTags: ["authoritative", "plainspoken"],
    nicheTags: ["real_estate", "finance"],
  },
  {
    name: "Leah Chen",
    persona: "founder",
    gender: "woman",
    ageRange: "25-34",
    style: "desk_review",
    toneTags: ["precise", "optimistic"],
    nicheTags: ["ai", "productivity"],
  },
  {
    name: "Mateo Ruiz",
    persona: "creator",
    gender: "man",
    ageRange: "18-24",
    style: "lifestyle",
    toneTags: ["funny", "high_energy"],
    nicheTags: ["travel", "food"],
  },
  {
    name: "Amara Ellis",
    persona: "coach",
    gender: "woman",
    ageRange: "25-34",
    style: "product_demo",
    toneTags: ["supportive", "clear"],
    nicheTags: ["beauty", "wellness"],
  },
  {
    name: "Rowan Lee",
    persona: "reviewer",
    gender: "nonbinary",
    ageRange: "35-44",
    style: "greenscreen",
    toneTags: ["measured", "insightful"],
    nicheTags: ["b2b", "software"],
  },
  {
    name: "Jules Hart",
    persona: "consumer",
    gender: "woman",
    ageRange: "18-24",
    style: "direct_to_camera",
    toneTags: ["casual", "excited"],
    nicheTags: ["fashion", "ecommerce"],
  },
  {
    name: "Andre Mills",
    persona: "expert",
    gender: "man",
    ageRange: "35-44",
    style: "street_interview",
    toneTags: ["grounded", "helpful"],
    nicheTags: ["career", "education"],
  },
  {
    name: "Tessa Morgan",
    persona: "founder",
    gender: "woman",
    ageRange: "35-44",
    style: "greenscreen",
    toneTags: ["bold", "strategic"],
    nicheTags: ["marketing", "saas"],
  },
  {
    name: "Kai Rivers",
    persona: "creator",
    gender: "nonbinary",
    ageRange: "25-34",
    style: "desk_review",
    toneTags: ["minimal", "smart"],
    nicheTags: ["design", "tech"],
  },
  {
    name: "Iris Novak",
    persona: "coach",
    gender: "woman",
    ageRange: "45-54",
    style: "direct_to_camera",
    toneTags: ["steady", "reassuring"],
    nicheTags: ["health", "wellness"],
  },
  {
    name: "Leo Grant",
    persona: "reviewer",
    gender: "man",
    ageRange: "25-34",
    style: "product_demo",
    toneTags: ["quick", "decisive"],
    nicheTags: ["consumer_apps", "gaming"],
  },
  {
    name: "Zara Flynn",
    persona: "consumer",
    gender: "woman",
    ageRange: "25-34",
    style: "lifestyle",
    toneTags: ["aspirational", "natural"],
    nicheTags: ["travel", "home"],
  },
];

async function main() {
  const existingLibraryAvatars = await db
    .select({ name: avatars.name })
    .from(avatars)
    .where(eq(avatars.kind, "library"));
  const existingNames = new Set(
    existingLibraryAvatars.map((avatar) => avatar.name),
  );
  const rowsToInsert = libraryAvatarSeeds
    .filter((seed) => !existingNames.has(seed.name))
    .map((seed) => ({
      kind: "library" as const,
      name: seed.name,
      imageUrls: [
        createPortraitPlaceholderDataUri({
          name: seed.name,
          label: seed.persona,
          seed: `${seed.name}:${seed.style}:${seed.gender}`,
        }),
      ],
      personaMetadata: {
        persona: seed.persona,
        gender: seed.gender,
        ageRange: seed.ageRange,
        style: seed.style,
        toneTags: seed.toneTags,
        nicheTags: seed.nicheTags,
      },
    }));

  if (rowsToInsert.length > 0) {
    await db.insert(avatars).values(rowsToInsert);
  }

  console.log(
    `Seeded ${rowsToInsert.length} library avatars (${libraryAvatarSeeds.length} total seeds).`,
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
