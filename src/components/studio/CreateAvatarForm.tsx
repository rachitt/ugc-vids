"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createAvatarAction } from "@/app/studio/new/actions";
import type { CreateAvatarActionState } from "@/app/studio/new/actions";

type CreateAvatarFormProps = {
  workspaceId?: string;
};

export function CreateAvatarForm({ workspaceId }: CreateAvatarFormProps) {
  const initialState: CreateAvatarActionState = {
    status: "idle",
  };
  const [state, formAction, isPending] = useActionState(
    createAvatarAction,
    initialState,
  );
  const disabled = !workspaceId || isPending;

  return (
    <form action={formAction} className="grid gap-5">
      <input name="workspaceId" type="hidden" value={workspaceId ?? ""} />

      <label className="grid gap-2 text-sm font-medium text-foreground">
        Name
        <input
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={disabled}
          maxLength={80}
          name="name"
          placeholder="Maya Carter"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        Look prompt
        <textarea
          className="min-h-32 rounded-md border border-input bg-background px-3 py-3 text-sm leading-6 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={disabled}
          maxLength={1200}
          name="lookPrompt"
          placeholder="Late-20s founder energy, warm brown eyes, sharp bob, clean streetwear, natural studio light."
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-foreground">
        Vibe/tone
        <textarea
          className="min-h-24 rounded-md border border-input bg-background px-3 py-3 text-sm leading-6 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          disabled={disabled}
          maxLength={500}
          name="vibeTone"
          placeholder="Confident, candid, practical, witty"
          required
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Custom avatar creation debits 4 credits.
        </p>
        <Button disabled={disabled} type="submit">
          <Sparkles aria-hidden="true" />
          {isPending ? "Creating" : "Create avatar"}
        </Button>
      </div>

      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              : "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          {state.message}
          {typeof state.balanceAfter === "number"
            ? ` Balance: ${state.balanceAfter} credits.`
            : ""}
        </p>
      ) : null}
    </form>
  );
}
