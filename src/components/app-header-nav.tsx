"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

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

function isActivePath(pathname: string, href: NavHref) {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/brand-profiles");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeaderNav() {
  const pathname = usePathname();

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
      </div>
    </header>
  );
}
