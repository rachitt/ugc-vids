import { generateMixedContentBatch } from "../src/lib/content/batch";

async function main() {
  const [brandProfileId, workspaceId, countArg] = process.argv.slice(2);
  if (!brandProfileId || !workspaceId) {
    throw new Error("Usage: generate-batch.ts <brandProfileId> <workspaceId> [count]");
  }

  const batch = await generateMixedContentBatch({
    brandProfileId,
    totalCount: countArg ? Number(countArg) : 8,
    workspaceId,
  });

  console.log("generated:", batch.items.length, "errors:", batch.errors.length);
  for (const err of batch.errors) {
    console.log("ERROR", err.format, err.message);
  }
  for (const item of batch.items) {
    console.log("ITEM", item.format, item.id);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
