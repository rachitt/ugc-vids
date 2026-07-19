import { expect, test, type Page } from "@playwright/test";
import { and, desc, eq } from "drizzle-orm";

import { db, pool } from "../../src/lib/db";
import {
  brandProfiles,
  calendarSlots,
  contentItems,
  users,
  workspaceMembers,
  workspaces,
} from "../../src/lib/db/schema";

test.setTimeout(180_000);

const workspaceName =
  process.env.FASTLANE_DEFAULT_WORKSPACE_NAME ?? "Fastlane Core Loop E2E";
const runId = process.env.FASTLANE_E2E_RUN_ID ?? `e2e-${Date.now()}`;
const testEmail = `core-loop-${runId}@example.test`;

test.afterAll(async () => {
  await deleteTestRows();
  await pool.end();
});

test("runs the fake-AI core loop through render, calendar, and download", async ({
  page,
}) => {
  await deleteTestRows();
  await signUpTestUser(page);

  await page.goto("/");
  await page.getByLabel("Website URL").fill(`https://${runId}.example.test`);
  await page.getByRole("button", { name: "Analyze" }).click();
  await page.waitForURL(/\/brand-profiles\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: `${runId}.example.test` }),
  ).toBeVisible();
  await expect(page.getByLabel("Hook angles")).toHaveValue(
    /The messy handoff before a campaign finally gets organized/,
  );

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

  const generationResponse = await page.request.post("/api/content/generate", {
    data: {
      brandProfileId: profile.id,
      totalCount: 3,
      workspaceId: profile.workspaceId,
    },
  });
  expect(generationResponse.ok()).toBeTruthy();
  expect(await generationResponse.json()).toMatchObject({
    generatedCount: 3,
    failedCount: 0,
  });

  await page.goto("/blitz");
  await expect(
    page.getByRole("heading", { name: "Swipe generated content" }),
  ).toBeVisible();
  await clickDeckButton(page, "Save current card");
  await clickDeckButton(page, "Save current card");
  await clickDeckButton(page, "Reject current card");
  await expect
    .poll(() => countItemsByStatus(profile.workspaceId), {
      timeout: 20_000,
    })
    .toEqual({ rejected: 1, saved: 2 });

  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Saved content" }),
  ).toBeVisible();
  await expect(page.getByText("2/20 saved")).toBeVisible();
  await page.getByRole("button", { name: "Render" }).first().click();

  await expect
    .poll(
      async () =>
        (await getRenderedContentItem(profile.workspaceId))?.videoUrl ?? null,
      {
        intervals: [2_000, 5_000],
        timeout: 180_000,
      },
    )
    .not.toBeNull();

  const renderedItem = await getRenderedContentItem(profile.workspaceId);

  if (!renderedItem?.videoUrl) {
    throw new Error("Rendered item did not receive a video URL.");
  }

  const videoResponse = await page.request.get(renderedItem.videoUrl);
  expect(videoResponse.status()).toBe(200);
  expect(videoResponse.headers()["content-type"]).toContain("video/mp4");
  expect((await videoResponse.body()).byteLength).toBeGreaterThan(100 * 1024);

  await page.goto("/calendar");
  await scheduleFirstTikTokSlot(page, renderedItem.id);
  await expect
    .poll(async () => (await getCalendarSlot(renderedItem.id))?.id ?? null, {
      timeout: 20_000,
    })
    .not.toBeNull();

  const slot = await getCalendarSlot(renderedItem.id);

  if (!slot) {
    throw new Error("Calendar slot was not created.");
  }

  const downloadResponse = await page.request.get(
    `/calendar/download/${slot.id}`,
  );
  expect(downloadResponse.status()).toBe(200);
  expect(downloadResponse.headers()["content-type"]).toContain("video/mp4");
  expect(downloadResponse.headers()["content-disposition"]).toContain(
    "attachment",
  );
});

async function deleteTestRows() {
  await db.delete(workspaces).where(eq(workspaces.name, workspaceName));
  await db.delete(users).where(eq(users.email, testEmail));
}

async function signUpTestUser(page: Page) {
  const response = await page.request.post("/api/auth/sign-up/email", {
    data: {
      name: "Core Loop E2E",
      email: testEmail,
      password: "core-loop-password-123",
      rememberMe: true,
    },
  });

  expect(response.status()).toBe(200);
}

async function clickDeckButton(page: Page, name: string) {
  const button = page.getByRole("button", { name });

  await expect(button).toBeEnabled({ timeout: 20_000 });
  await button.click();
}

async function scheduleFirstTikTokSlot(page: Page, contentItemId: string) {
  await expect(
    page.locator(`[data-calendar-content-item-id="${contentItemId}"]`),
  ).toBeVisible();
  await expect(
    page.locator('[data-calendar-drop-cell][data-platform="tiktok"]').first(),
  ).toBeVisible();

  await page.evaluate((itemId) => {
    const source = document.querySelector(
      `[data-calendar-content-item-id="${itemId}"]`,
    );
    const target = document.querySelector(
      '[data-calendar-drop-cell][data-platform="tiktok"]',
    );

    if (!source || !target) {
      throw new Error("Calendar drag source or drop target was not found.");
    }

    const dataTransfer = new DataTransfer();
    source.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }),
    );
    target.dispatchEvent(
      new DragEvent("dragenter", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }),
    );
    target.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }),
    );
    target.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }),
    );
  }, contentItemId);
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

async function countItemsByStatus(workspaceId: string) {
  const rows = await db
    .select({
      status: contentItems.status,
    })
    .from(contentItems)
    .where(eq(contentItems.workspaceId, workspaceId));

  return {
    rejected: rows.filter((row) => row.status === "rejected").length,
    saved: rows.filter((row) => row.status === "saved").length,
  };
}

async function getRenderedContentItem(workspaceId: string) {
  const [item] = await db
    .select({
      id: contentItems.id,
      videoUrl: contentItems.videoUrl,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, workspaceId),
        eq(contentItems.renderStatus, "rendered"),
      ),
    )
    .orderBy(desc(contentItems.updatedAt))
    .limit(1);

  return item ?? null;
}

async function getCalendarSlot(contentItemId: string) {
  const [slot] = await db
    .select({
      id: calendarSlots.id,
    })
    .from(calendarSlots)
    .where(eq(calendarSlots.contentItemId, contentItemId))
    .orderBy(desc(calendarSlots.createdAt))
    .limit(1);

  return slot ?? null;
}
