import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getWorkspaceSaveLimit,
  listSavedContentItems,
} from "@/lib/content/queries";
import { getActiveWorkspaceContext } from "@/lib/workspaces";

import { LibraryGrid } from "./library-grid";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { workspace } = await getActiveWorkspaceContext();

  const [items, saveLimit] = await Promise.all([
    listSavedContentItems(workspace.id),
    getWorkspaceSaveLimit(workspace.id),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-muted-foreground">
              Content Library
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              Saved content
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Saved rows for {workspace.name}. Keep winners, move drafts back
              into Blitz, or reject items that should leave the library.
            </p>
          </div>
          <Button asChild>
            <Link href={{ pathname: "/blitz" }}>
              <Sparkles className="size-4" aria-hidden="true" />
              Blitz
            </Link>
          </Button>
        </header>

        <LibraryGrid items={items} saveLimit={saveLimit} />
      </section>
    </main>
  );
}
