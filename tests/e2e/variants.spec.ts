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
  process.env.FASTLANE_DEFAULT_WORKSPACE_NAME ?? "Fastlane Variants E2E";
const runId = process.env.FASTLANE_E2E_RUN_ID ?? `e2e-${Date.now()}`;
const testEmail = `variants-${runId}@example.test`;

test.afterAll(async () => {
  await deleteTestRows();
  // Shared pool stays open; see the afterAll note in core-loop.spec.ts.
});

test("creates saved-item variants from the library and surfaces them in Blitz", async ({
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

  const generationResponse = await page.request.post("/content/generate", {
    data: {
      brandProfileId: profile.id,
      totalCount: 2,
      workspaceId: profile.workspaceId,
    },
  });
  expect(generationResponse.ok()).toBeTruthy();
  expect(await generationResponse.json()).toMatchObject({
    generatedCount: 2,
    failedCount: 0,
  });

  await page.goto("/blitz");
  await expect(
    page.getByRole("heading", { name: "Swipe generated content" }),
  ).toBeVisible();
  await clickDeckButton(page, "Save current card");

  await expect
    .poll(async () => getLatestSavedItem(profile.workspaceId), {
      timeout: 20_000,
    })
    .not.toBeNull();

  const savedItem = await getLatestSavedItem(profile.workspaceId);

  if (!savedItem) {
    throw new Error("Saved item was not created.");
  }

  await page.goto("/library");
  await expect(
    page.locator(`[data-library-content-item-id="${savedItem.id}"]`),
  ).toBeVisible();
  await page.getByRole("button", { name: "More like this" }).first().click();
  await expect(
    page.getByText("2 variants queued - review in Blitz"),
  ).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(async () => (await getGeneratedVariants(savedItem.id)).length, {
      timeout: 20_000,
    })
    .toBe(2);

  const variants = await getGeneratedVariants(savedItem.id);

  expect(variants).toHaveLength(2);
  expect(variants.every((item) => item.variantOf === savedItem.id)).toBe(true);

  await page.goto("/blitz");

  for (const variant of variants) {
    await expect(
      page.locator(`[data-blitz-content-item-id="${variant.id}"]`),
    ).toBeVisible();
  }
});

async function deleteTestRows() {
  await db.delete(workspaces).where(eq(workspaces.name, workspaceName));
  await db.delete(users).where(eq(users.email, testEmail));
}

async function signUpTestUser(page: Page) {
  const response = await page.request.post("/api/auth/sign-up/email", {
    data: {
      name: "Variants E2E",
      email: testEmail,
      password: "variants-password-123",
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
      workspaceId: brandProfiles.workspaceId,
    })
    .from(brandProfiles)
    .where(eq(brandProfiles.id, profileId))
    .limit(1);

  if (!profile) {
    throw new Error(`Brand profile ${profileId} was not found.`);
  }

  return profile;
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

async function clickDeckButton(page: Page, name: string) {
  const button = page.getByRole("button", { name });

  await expect(button).toBeEnabled({ timeout: 20_000 });
  await button.click();
}

async function getLatestSavedItem(workspaceId: string) {
  const [item] = await db
    .select({
      id: contentItems.id,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.status, "saved"),
      ),
    )
    .orderBy(desc(contentItems.updatedAt))
    .limit(1);

  return item ?? null;
}

async function getGeneratedVariants(contentItemId: string) {
  return db
    .select({
      id: contentItems.id,
      variantOf: contentItems.variantOf,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.variantOf, contentItemId),
        eq(contentItems.status, "generated"),
      ),
    )
    .orderBy(desc(contentItems.createdAt));
}
