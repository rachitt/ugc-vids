import { expect, test, type Page } from "@playwright/test";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../../src/lib/db";
import {
  brandProfiles,
  contentItems,
  users,
  workspaceMembers,
  workspaces,
} from "../../src/lib/db/schema";

test.setTimeout(60_000);

const workspaceName =
  process.env.FASTLANE_DEFAULT_WORKSPACE_NAME ?? "Fastlane UGC Standard E2E";
const runId = process.env.FASTLANE_E2E_RUN_ID ?? `e2e-${Date.now()}`;
const testEmail = `ugc-standard-${runId}@example.test`;

test.afterAll(async () => {
  await deleteTestRows();
  // Shared pool stays open; see the afterAll note in core-loop.spec.ts.
});

test("creates capture-backed hook demo props in fake scrape mode", async ({
  page,
}) => {
  await deleteTestRows();
  await signUpTestUser(page);

  await page.goto("/");
  await page.getByLabel("Website URL").fill(`https://${runId}.example.test`);
  await page.getByRole("button", { name: "Analyze" }).click();
  await page.waitForURL(/\/brand-profiles\/[0-9a-f-]+$/);

  const profileId = profileIdFromUrl(page.url());
  const profile = await getBrandProfile(profileId);

  await db
    .insert(workspaceMembers)
    .values({
      role: "owner",
      userId: await userIdForEmail(testEmail),
      workspaceId: profile.workspaceId,
    })
    .onConflictDoNothing();

  await expect
    .poll(async () => (await getBrandProfile(profileId)).siteCaptures.length, {
      intervals: [500, 1_000, 2_000],
      timeout: 20_000,
    })
    .toBeGreaterThan(0);

  const generationResponse = await page.request.post("/content/generate", {
    data: {
      brandProfileId: profile.id,
      requestedFormats: ["hook_demo"],
      totalCount: 1,
      workspaceId: profile.workspaceId,
    },
  });
  expect(generationResponse.ok()).toBeTruthy();
  expect(await generationResponse.json()).toMatchObject({
    generatedCount: 1,
    failedCount: 0,
  });

  const item = await getNewestHookDemoItem(profile.workspaceId);

  if (!item) {
    throw new Error("Hook demo content item was not generated.");
  }

  const hookDemo = getHookDemoProps(item.remotionProps);
  const ugcClipSrc = hookDemo.ugcClip?.src;

  if (typeof ugcClipSrc !== "string") {
    throw new Error("Hook demo props are missing a UGC clip src.");
  }

  expect(ugcClipSrc).toMatch(/^asset:ugc\/ugc-\d{2}$/);
  expect(hookDemo.captures.length).toBeGreaterThanOrEqual(1);
  expect(hookDemo.captures[0]).toMatchObject({ kind: "image" });
});

async function deleteTestRows() {
  await db.delete(workspaces).where(eq(workspaces.name, workspaceName));
  await db.delete(users).where(eq(users.email, testEmail));
}

async function signUpTestUser(page: Page) {
  const response = await page.request.post("/api/auth/sign-up/email", {
    data: {
      name: "UGC Standard E2E",
      email: testEmail,
      password: "ugc-standard-password-123",
      rememberMe: true,
    },
  });

  expect(response.status()).toBe(200);
}

function profileIdFromUrl(url: string) {
  const match = url.match(/\/brand-profiles\/([0-9a-f-]+)$/);

  if (!match) {
    throw new Error(`Could not read profile id from ${url}.`);
  }

  return match[1];
}

async function getBrandProfile(profileId: string) {
  const [profile] = await db
    .select({
      id: brandProfiles.id,
      siteCaptures: brandProfiles.siteCaptures,
      workspaceId: brandProfiles.workspaceId,
    })
    .from(brandProfiles)
    .where(eq(brandProfiles.id, profileId))
    .limit(1);

  if (!profile) {
    throw new Error(`Brand profile ${profileId} was not found.`);
  }

  return {
    ...profile,
    siteCaptures: profile.siteCaptures ?? [],
  };
}

async function userIdForEmail(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`User ${email} was not found.`);
  }

  return user.id;
}

async function getNewestHookDemoItem(workspaceId: string) {
  const [item] = await db
    .select({
      id: contentItems.id,
      remotionProps: contentItems.remotionProps,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.format, "hook_demo"),
      ),
    )
    .orderBy(desc(contentItems.createdAt))
    .limit(1);

  return item ?? null;
}

function getHookDemoProps(remotionProps: Record<string, unknown>) {
  const hookDemo = remotionProps.hookDemo;

  if (
    typeof hookDemo !== "object" ||
    hookDemo === null ||
    Array.isArray(hookDemo)
  ) {
    throw new Error("Generated item is missing hookDemo props.");
  }

  const hookDemoRecord = hookDemo as Record<string, unknown>;
  const captures = Array.isArray(hookDemoRecord.captures)
    ? hookDemoRecord.captures
    : [];
  const ugcClip =
    typeof hookDemoRecord.ugcClip === "object" &&
    hookDemoRecord.ugcClip !== null &&
    !Array.isArray(hookDemoRecord.ugcClip)
      ? (hookDemoRecord.ugcClip as Record<string, unknown>)
      : null;

  return {
    captures,
    ugcClip,
  };
}
