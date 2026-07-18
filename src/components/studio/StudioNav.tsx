import Link from "next/link";
import { Clapperboard, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudioNavProps = {
  active: "avatars" | "new" | "clips";
  workspaceId?: string;
};

const navItems = [
  {
    id: "avatars",
    href: "/studio",
    label: "Avatars",
    icon: Users,
  },
  {
    id: "new",
    href: "/studio/new",
    label: "New avatar",
    icon: Sparkles,
  },
  {
    id: "clips",
    href: "/studio/clips",
    label: "UGC clips",
    icon: Clapperboard,
  },
] as const;

export function StudioNav({ active, workspaceId }: StudioNavProps) {
  const query = workspaceId ? { workspaceId } : undefined;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Studio navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;

        return (
          <Button
            asChild
            key={item.id}
            size="sm"
            variant={isActive ? "default" : "outline"}
          >
            <Link
              className={cn(!isActive && "bg-background")}
              href={{ pathname: item.href, query }}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
