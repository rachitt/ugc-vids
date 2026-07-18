import Link from "next/link";
import { Library, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getWorkspaceSaveLimit,
  listGeneratedContentItems,
} from "@/lib/content/queries";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

import { BlitzDeck } from "./blitz-deck";

const LOW_DECK_THRESHOLD = 3;

export const dynamic = "force-dynamic";

export default async function BlitzPage() {
  const { workspace } = await getActiveWorkspaceContext();

  const [items, saveLimit] = await Promise.all([
    listGeneratedContentItems(workspace.id),
    getWorkspaceSaveLimit(workspace.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium uppercase text-muted-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
              Blitz Mode
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              Swipe generated content
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Reviewing generated rows for {workspace.name}. Drag right to save
              or left to reject.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={{ pathname: "/library" }}>
              <Library className="size-4" aria-hidden="true" />
              Library
            </Link>
          </Button>
        </header>

        <BlitzDeck
          items={items}
          lowDeckThreshold={LOW_DECK_THRESHOLD}
          saveLimit={saveLimit}
        />
      </section>
    </main>
  );
}
