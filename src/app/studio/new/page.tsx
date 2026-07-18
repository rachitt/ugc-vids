import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateAvatarForm } from "@/components/studio/CreateAvatarForm";
import { StudioNav } from "@/components/studio/StudioNav";
import {
  CREDIT_COSTS,
  getCreditBalance,
  PLAN_CREDIT_ALLOWANCES,
} from "@/lib/credits";

import {
  resolveStudioWorkspace,
  type StudioSearchParams,
} from "../workspace";

type NewAvatarPageProps = {
  searchParams?: Promise<StudioSearchParams>;
};

function labelFor(value: string) {
  return value
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function NewAvatarPage({
  searchParams,
}: NewAvatarPageProps) {
  const params = searchParams ? await searchParams : {};
  const workspace = await resolveStudioWorkspace(params);
  const balance = workspace ? await getCreditBalance(workspace.id) : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 border-b pb-6">
          <StudioNav active="new" workspaceId={workspace?.id} />
          <Button asChild className="w-fit" size="sm" variant="ghost">
            <Link
              href={
                workspace ? `/studio?workspaceId=${workspace.id}` : "/studio"
              }
            >
              <ArrowLeft aria-hidden="true" />
              Back to avatars
            </Link>
          </Button>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                Custom AI influencer
              </p>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Create a custom avatar
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Save a consistent character sheet and placeholder portrait for
                later image and video generation work.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-card-foreground">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Coins className="size-4 text-muted-foreground" aria-hidden />
                Credits
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {balance ?? "No workspace"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {workspace
                  ? `${labelFor(workspace.plan)} plan allowance: ${
                      PLAN_CREDIT_ALLOWANCES[workspace.plan]
                    }`
                  : "Create or select a workspace first."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-lg border bg-card p-5 text-card-foreground">
            <CreateAvatarForm workspaceId={workspace?.id} />
          </div>
          <aside className="grid h-fit gap-4 rounded-lg border bg-card p-5 text-sm text-card-foreground">
            <div>
              <h2 className="font-semibold">Active workspace</h2>
              <p className="mt-1 text-muted-foreground">
                {workspace
                  ? `${workspace.name} (${labelFor(workspace.plan)})`
                  : "No workspace row found."}
              </p>
            </div>
            <div>
              <h2 className="font-semibold">Creation cost</h2>
              <p className="mt-1 text-muted-foreground">
                {CREDIT_COSTS.image} credits per generated image. This flow
                creates one placeholder character-sheet image.
              </p>
            </div>
            {!workspace ? (
              <p className="rounded-md border border-dashed p-3 text-muted-foreground">
                Pass a valid `workspaceId` query parameter or create a
                workspace before submitting the form.
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
