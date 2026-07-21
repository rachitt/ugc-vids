"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  SetActiveWorkspaceResult,
  WorkspaceSwitcherOption,
} from "@/lib/workspaces";

const navItems = [
  { href: "/", label: "Brand Profiles" },
  { href: "/content", label: "Content" },
  { href: "/blitz", label: "Blitz" },
  { href: "/library", label: "Library" },
  { href: "/calendar", label: "Calendar" },
  { href: "/trending", label: "Trending" },
  { href: "/studio", label: "Studio" },
  { href: "/analytics", label: "Analytics" },
] as const;

type NavHref = (typeof navItems)[number]["href"];

type AppHeaderNavClientProps = {
  activeWorkspaceId: string;
  setActiveWorkspaceAction: (
    workspaceId: string,
  ) => Promise<SetActiveWorkspaceResult>;
  workspaces: WorkspaceSwitcherOption[];
};

function isActivePath(pathname: string, href: NavHref) {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/brand-profiles");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function optionLabel(workspace: WorkspaceSwitcherOption) {
  const profileLabel =
    workspace.brandProfileCount === 1 ? "profile" : "profiles";
  const itemLabel = workspace.contentItemCount === 1 ? "item" : "items";

  return `${workspace.name} (${workspace.brandProfileCount} ${profileLabel}, ${workspace.contentItemCount} ${itemLabel})`;
}

export function AppHeaderNavClient({
  activeWorkspaceId,
  setActiveWorkspaceAction,
  workspaces,
}: AppHeaderNavClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState(activeWorkspaceId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedWorkspaceId(activeWorkspaceId);
  }, [activeWorkspaceId]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          aria-label="Fastlane brand profiles"
          className="flex w-fit items-center gap-2 text-sm font-semibold tracking-normal"
          href="/"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Fastlane
        </Link>
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <nav aria-label="Primary navigation" className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted text-foreground",
                    )}
                    href={item.href as Route}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <BriefcaseBusiness className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Active workspace</span>
              <select
                aria-label="Active workspace"
                className="h-9 max-w-full rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-60 lg:max-w-64"
                disabled={isPending || workspaces.length < 2}
                onChange={(event) => {
                  const nextWorkspaceId = event.currentTarget.value;

                  setSelectedWorkspaceId(nextWorkspaceId);
                  setError(null);
                  startTransition(async () => {
                    const result =
                      await setActiveWorkspaceAction(nextWorkspaceId);

                    if (!result.ok) {
                      setSelectedWorkspaceId(activeWorkspaceId);
                      setError(result.error);
                      return;
                    }

                    router.refresh();
                  });
                }}
                value={selectedWorkspaceId}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {optionLabel(workspace)}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="text-xs text-destructive" role="status">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
