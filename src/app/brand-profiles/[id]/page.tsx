import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Save, Sparkles } from "lucide-react";

import { updateBrandProfileAction } from "@/app/brand-profiles/actions";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type BrandProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string | string[];
  }>;
};

export default async function BrandProfilePage({
  params,
  searchParams,
}: BrandProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const savedParam = query?.saved;
  const saved = Array.isArray(savedParam)
    ? savedParam[0] === "1"
    : savedParam === "1";
  const profile = await getBrandProfile(id);

  if (!profile) {
    notFound();
  }

  const saveAction = updateBrandProfileAction.bind(null, profile.id);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Brand profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">
                {getHostname(profile.url)}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={profile.url} rel="noreferrer" target="_blank">
                <ExternalLink className="size-4" aria-hidden="true" />
                Visit
              </a>
            </Button>
          </div>
        </header>

        {saved ? (
          <p className="rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm text-secondary-foreground">
            Profile saved.
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <form
            action={saveAction}
            className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          >
            <EditableField
              label="Product description"
              name="productDesc"
              rows={5}
              value={profile.productDesc ?? ""}
            />
            <EditableField
              label="Audience"
              name="audience"
              rows={4}
              value={profile.audience ?? ""}
            />
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="tone">
                Tone
              </label>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                defaultValue={profile.tone ?? ""}
                id="tone"
                name="tone"
              />
            </div>
            <EditableField
              label="Niche tags"
              name="nicheTags"
              rows={3}
              value={profile.nicheTags.join(", ")}
            />
            <EditableField
              label="Pain points"
              name="painPoints"
              rows={6}
              value={profile.painPoints.join("\n")}
            />
            <EditableField
              label="Hook angles"
              name="hookAngles"
              rows={12}
              value={profile.hookAngles.join("\n")}
            />
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="size-4" aria-hidden="true" />
                Save profile
              </Button>
            </div>
          </form>

          <aside className="grid gap-4">
            <section className="rounded-lg border bg-card p-4 text-card-foreground">
              <h2 className="text-sm font-semibold">Scraped pages</h2>
              <div className="mt-4 grid gap-3">
                {profile.scrapedPages.map((page) => (
                  <a
                    className="rounded-md border bg-background p-3 text-sm transition-colors hover:border-ring"
                    href={page.url}
                    key={`${page.label}-${page.url}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="font-medium capitalize">{page.label}</span>
                    <span className="mt-1 block truncate text-muted-foreground">
                      {page.title ?? page.url}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-lg border bg-card p-4 text-card-foreground">
              <h2 className="text-sm font-semibold">Profile signals</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Hooks</dt>
                  <dd className="mt-1 font-medium">
                    {profile.hookAngles.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pain points</dt>
                  <dd className="mt-1 font-medium">
                    {profile.painPoints.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="mt-1 font-medium">
                    {profile.updatedAt.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function EditableField({
  label,
  name,
  rows,
  value,
}: {
  label: string;
  name: string;
  rows: number;
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <textarea
        className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        defaultValue={value}
        id={name}
        name={name}
        rows={rows}
      />
    </div>
  );
}

async function getBrandProfile(id: string) {
  const [profile] = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.id, id))
    .limit(1);

  return profile;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
