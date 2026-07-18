import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createFallbackPromptRecipe,
  type PromptRecipe,
} from "@/lib/trends/metadata";
import {
  getTrendTemplateById,
  listTrendTemplates,
  remotionTemplateLabels,
  type TrendTemplateView,
} from "@/lib/trends/queries";
import { compositionIds } from "@/lib/video/remotion-props";

import {
  createTrendTemplateAction,
  updateTrendTemplateAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Record<string, SearchParamValue>;

type TrendingAdminPageProps = {
  searchParams?: Promise<SearchParams>;
};

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function recipeValue(template: TrendTemplateView | null): string {
  const promptRecipe: PromptRecipe =
    template?.metadata?.promptRecipe ??
    createFallbackPromptRecipe(
      template?.title ?? "New trend hook",
      template?.structureDescription ??
        "Describe the short-form pattern this template should generate.",
    );

  return JSON.stringify(promptRecipe, null, 2);
}

function TemplateForm({ template }: { template: TrendTemplateView | null }) {
  const isEditing = Boolean(template);

  return (
    <form
      action={isEditing ? updateTrendTemplateAction : createTrendTemplateAction}
      className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground"
    >
      {template ? <input name="id" type="hidden" value={template.id} /> : null}

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="title">
          Name
        </label>
        <input
          className="h-11 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
          defaultValue={template?.title}
          id="title"
          name="title"
          placeholder="POV: your customer finally gets it"
          required
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_220px]">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nicheTags">
            Niche tags
          </label>
          <input
            className="h-11 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
            defaultValue={template?.nicheTags.join(", ") ?? "saas"}
            id="nicheTags"
            name="nicheTags"
            placeholder="saas, ecommerce, fitness"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="remotionTemplateId">
            Format
          </label>
          <select
            className="h-11 rounded-md border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
            defaultValue={template?.remotionTemplateId ?? "slideshow"}
            id="remotionTemplateId"
            name="remotionTemplateId"
          >
            {compositionIds.map((id) => (
              <option key={id} value={id}>
                {remotionTemplateLabels[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="structureDescription">
          Structure description
        </label>
        <textarea
          className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none ring-ring focus:ring-2"
          defaultValue={template?.structureDescription}
          id="structureDescription"
          name="structureDescription"
          placeholder="POV hook, fast caption stack, meme background, and one payoff frame."
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="engagementNotes">
          Engagement notes
        </label>
        <textarea
          className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none ring-ring focus:ring-2"
          defaultValue={template?.engagementNotes ?? ""}
          id="engagementNotes"
          name="engagementNotes"
          placeholder="Explain why the hook, pacing, and format tend to hold attention."
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="promptRecipe">
          Prompt recipe JSON
        </label>
        <textarea
          className="min-h-72 rounded-md border bg-background px-3 py-2 font-mono text-xs leading-5 outline-none ring-ring focus:ring-2"
          defaultValue={recipeValue(template)}
          id="promptRecipe"
          name="promptRecipe"
          required
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">
          {isEditing ? (
            <Pencil className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {isEditing ? "Save trend" : "Add trend"}
        </Button>
        {isEditing ? (
          <Button asChild variant="outline">
            <Link href={{ pathname: "/trending/admin" }}>Cancel edit</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default async function TrendingAdminPage({
  searchParams,
}: TrendingAdminPageProps) {
  const params = searchParams ? await searchParams : {};
  const editId = firstParam(params.edit);
  const [templates, editingTemplate] = await Promise.all([
    listTrendTemplates(),
    editId ? getTrendTemplateById(editId) : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">
              Trend admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">
              {editingTemplate ? "Edit trend template" : "Add trend template"}
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href={{ pathname: "/trending" }}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to library
            </Link>
          </Button>
        </div>

        <TemplateForm template={editingTemplate} />

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold tracking-normal">
            Existing templates
          </h2>
          <div className="grid gap-3">
            {templates.map((template) => (
              <div
                className="grid gap-4 rounded-lg border bg-card p-4 text-card-foreground md:grid-cols-[1fr_auto] md:items-center"
                key={template.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{template.title}</p>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {template.remotionTemplateLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {template.structureDescription}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={{
                      pathname: "/trending/admin",
                      query: { edit: template.id },
                    }}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
