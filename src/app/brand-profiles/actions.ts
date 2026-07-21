"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { eq } from "drizzle-orm";

import { analyzeBrandProfile } from "@/lib/brand/analysis";
import { captureBrandProfileSite } from "@/lib/brand/site-captures";
import { normalizeWebsiteUrl, scrapeBrandWebsite } from "@/lib/brand/scraper";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { enqueueBrandProfileCapture } from "@/lib/jobs/capture-enqueue";
import {
  getOrCreateDefaultWorkspace,
  setActiveWorkspaceAction,
} from "@/lib/workspaces";

export async function createBrandProfileAction(formData: FormData) {
  let profileId: string;

  try {
    const rawUrl = getRequiredFormValue(formData, "url");
    const url = normalizeWebsiteUrl(rawUrl);
    const scrape = await scrapeBrandWebsite(url);
    const analysis = await analyzeBrandProfile(scrape);
    const workspace = await getOrCreateDefaultWorkspace();
    const [profile] = await db
      .insert(brandProfiles)
      .values({
        analysisMetadata: {
          analyzedAt: new Date().toISOString(),
          hookAngleCount: analysis.hookAngles.length,
          pagesFetched: scrape.pages.map((page) => ({
            label: page.label,
            status: page.status,
            url: page.url,
          })),
          source: "claude-agent-sdk",
        },
        audience: analysis.audience,
        colors: scrape.colors,
        hookAngles: analysis.hookAngles,
        logoUrl: scrape.logoUrl,
        nicheTags: analysis.nicheTags,
        painPoints: analysis.painPoints,
        productDesc: analysis.productDescription,
        scrapedPages: scrape.pages,
        scrapedSummary: scrape.summary,
        tone: analysis.tone,
        url: scrape.rootUrl,
        workspaceId: workspace.id,
      })
      .returning({
        id: brandProfiles.id,
      });

    if (!profile) {
      throw new Error("The brand profile could not be saved.");
    }

    const activeWorkspaceResult = await setActiveWorkspaceAction(workspace.id);

    if (!activeWorkspaceResult.ok) {
      throw new Error(activeWorkspaceResult.error);
    }

    profileId = profile.id;

    try {
      if (process.env.FASTLANE_FAKE_SCRAPE === "1") {
        // Fixture captures need no browser and no worker; running them inline
        // keeps fake mode (CI, e2e) self-contained.
        await captureBrandProfileSite({
          brandProfileId: profile.id,
          url: scrape.rootUrl,
        });
      } else {
        await enqueueBrandProfileCapture({
          brandProfileId: profile.id,
          url: scrape.rootUrl,
        });
      }
    } catch (error) {
      console.warn("Could not capture brand profile site.", {
        brandProfileId: profile.id,
        error,
      });
    }
  } catch (error) {
    redirect(`/?error=${encodeURIComponent(toActionErrorMessage(error))}`);
  }

  revalidatePath("/");
  redirect(`/brand-profiles/${profileId}` as Route);
}

export async function updateBrandProfileAction(
  profileId: string,
  formData: FormData,
) {
  const productDesc = getOptionalFormValue(formData, "productDesc");
  const audience = getOptionalFormValue(formData, "audience");
  const tone = getOptionalFormValue(formData, "tone");
  const nicheTags = parseDelimitedList(
    getOptionalFormValue(formData, "nicheTags") ?? "",
    14,
    true,
  ).map((tag) => tag.toLowerCase());
  const painPoints = parseDelimitedList(
    getOptionalFormValue(formData, "painPoints") ?? "",
    12,
    false,
  );
  const hookAngles = parseDelimitedList(
    getOptionalFormValue(formData, "hookAngles") ?? "",
    40,
    false,
  );

  const [profile] = await db
    .update(brandProfiles)
    .set({
      audience,
      hookAngles,
      nicheTags,
      painPoints,
      productDesc,
      tone,
      updatedAt: new Date(),
    })
    .where(eq(brandProfiles.id, profileId))
    .returning({
      id: brandProfiles.id,
    });

  if (!profile) {
    redirect(`/?error=${encodeURIComponent("Brand profile not found.")}`);
  }

  revalidatePath("/");
  revalidatePath(`/brand-profiles/${profileId}`);
  redirect(`/brand-profiles/${profileId}?saved=1` as Route);
}

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Enter a website URL.");
  }

  return value.trim();
}

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function parseDelimitedList(
  value: string,
  maxItems: number,
  splitCommas: boolean,
) {
  const seen = new Set<string>();
  const items: string[] = [];
  const rawItems = splitCommas ? value.split(/\n|,/) : value.split(/\n/);

  for (const item of rawItems) {
    const trimmed = item
      .replace(/^[-*\d.]+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = trimmed.toLowerCase();

    if (!trimmed || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(trimmed);
  }

  return items.slice(0, maxItems);
}

function toActionErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "Could not read that site. Check the URL and try again.";
  }

  if (error instanceof Error) {
    return error.message.slice(0, 180);
  }

  return "Brand profile generation failed.";
}
