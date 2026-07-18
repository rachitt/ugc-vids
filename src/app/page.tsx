import { ArrowRight, Database, Film, ServerCog, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const scaffoldItems = [
  {
    label: "App Router",
    value: "Next.js 15",
    icon: ServerCog,
  },
  {
    label: "Data layer",
    value: "Drizzle + Postgres",
    icon: Database,
  },
  {
    label: "Auth",
    value: "better-auth",
    icon: ShieldCheck,
  },
  {
    label: "Video",
    value: "Remotion worker",
    icon: Film,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-10">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium uppercase text-muted-foreground">
            Phase 0
          </p>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="flex max-w-3xl flex-col gap-5">
              <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
                Fastlane
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Project shell for the Fastlane clone, with the app, data,
                storage, auth, queue, and worker foundations in place.
              </p>
            </div>
            <div className="flex gap-3 lg:justify-end">
              <Button variant="outline" disabled>
                Sign in
              </Button>
              <Button disabled>
                New brand
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scaffoldItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="rounded-lg border bg-card p-4 text-card-foreground"
                key={item.label}
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-medium">{item.value}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
