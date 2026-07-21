"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, Globe2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createBrandProfileAction } from "@/app/brand-profiles/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="h-11 sm:w-36" disabled={pending} type="submit">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Analyzing…
        </>
      ) : (
        <>
          Analyze
          <ArrowRight className="size-4" aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

function PendingNotice() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      Reading the site and building your brand profile with AI — this usually
      takes 30–60 seconds. You&apos;ll be redirected when it&apos;s ready.
    </p>
  );
}

export function BrandIntakeForm({ error }: { error?: string }) {
  return (
    <form
      action={createBrandProfileAction}
      className="flex max-w-2xl flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
    >
      <label className="text-sm font-medium" htmlFor="url">
        Website URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Globe2
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            id="url"
            name="url"
            placeholder="https://example.com"
            required
            type="url"
          />
        </div>
        <SubmitButton />
      </div>
      <PendingNotice />
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
