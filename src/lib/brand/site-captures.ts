import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "../db";
import { brandProfiles, type BrandProfileSiteCapture } from "../db/schema";
import { createVideoStorageFromEnv } from "../storage/video-storage";

export type CaptureBrandProfileSiteInput = {
  brandProfileId: string;
  url: string;
};

type CaptureSpec = {
  height: number;
  label: string;
  localPath: string;
  viewport: BrandProfileSiteCapture["viewport"];
  width: number;
};

const MOBILE_VIEWPORT = {
  height: 844,
  width: 390,
} as const;
const DESKTOP_VIEWPORT = {
  height: 900,
  width: 1440,
} as const;
const CAPTURE_NAVIGATION_TIMEOUT_MS = 30_000;

const fakeCaptureFixtures = [
  {
    height: MOBILE_VIEWPORT.height,
    label: "Mobile hero",
    localPath: path.join(
      process.cwd(),
      "public/assets/fixtures/capture-mobile-hero.png",
    ),
    viewport: "mobile",
    width: MOBILE_VIEWPORT.width,
  },
  {
    height: MOBILE_VIEWPORT.height,
    label: "Mobile scroll",
    localPath: path.join(
      process.cwd(),
      "public/assets/fixtures/capture-mobile-scroll.png",
    ),
    viewport: "mobile",
    width: MOBILE_VIEWPORT.width,
  },
  {
    height: DESKTOP_VIEWPORT.height,
    label: "Desktop hero",
    localPath: path.join(
      process.cwd(),
      "public/assets/fixtures/capture-desktop-hero.png",
    ),
    viewport: "desktop",
    width: DESKTOP_VIEWPORT.width,
  },
] satisfies CaptureSpec[];

export async function captureBrandProfileSite({
  brandProfileId,
  url,
}: CaptureBrandProfileSiteInput): Promise<BrandProfileSiteCapture[]> {
  const [profile] = await db
    .select({
      id: brandProfiles.id,
      workspaceId: brandProfiles.workspaceId,
    })
    .from(brandProfiles)
    .where(eq(brandProfiles.id, brandProfileId))
    .limit(1);

  if (!profile) {
    throw new Error(`Brand profile ${brandProfileId} was not found.`);
  }

  const specs =
    process.env.FASTLANE_FAKE_SCRAPE === "1"
      ? fakeCaptureFixtures
      : await captureLiveSiteScreenshots(url, brandProfileId);
  const storage = createVideoStorageFromEnv();
  const captures: BrandProfileSiteCapture[] = [];

  for (const spec of specs) {
    captures.push(
      await storeCapture({
        brandProfileId: profile.id,
        spec,
        storage,
        workspaceId: profile.workspaceId,
      }),
    );
  }

  await db
    .update(brandProfiles)
    .set({
      siteCaptures: captures,
      updatedAt: new Date(),
    })
    .where(eq(brandProfiles.id, profile.id));

  return captures;
}

async function captureLiveSiteScreenshots(
  url: string,
  brandProfileId: string,
): Promise<CaptureSpec[]> {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  const outputDir = await createCaptureTempDir(brandProfileId);
  const specs: CaptureSpec[] = [];

  try {
    const mobileContext = await browser.newContext({
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
      viewport: MOBILE_VIEWPORT,
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(url, {
      timeout: CAPTURE_NAVIGATION_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });
    await mobilePage
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {
        // Some marketing sites keep analytics connections open; DOM content is
        // enough for a useful product capture.
      });

    for (const [index, scrollY] of [0, 610, 1220].entries()) {
      await mobilePage.evaluate((nextScrollY: number) => {
        window.scrollTo(0, nextScrollY);
      }, scrollY);
      await mobilePage.waitForTimeout(450);

      const label = index === 0 ? "Mobile hero" : `Mobile scroll ${index}`;
      const localPath = path.join(outputDir, `${slugify(label)}.png`);

      await mobilePage.screenshot({
        fullPage: false,
        path: localPath,
        type: "png",
      });
      specs.push({
        height: MOBILE_VIEWPORT.height,
        label,
        localPath,
        viewport: "mobile",
        width: MOBILE_VIEWPORT.width,
      });
    }

    await mobileContext.close();

    const desktopContext = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: DESKTOP_VIEWPORT,
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(url, {
      timeout: CAPTURE_NAVIGATION_TIMEOUT_MS,
      waitUntil: "domcontentloaded",
    });
    await desktopPage
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {
        // Best-effort capture; do not fail solely because the page keeps loading.
      });

    const localPath = path.join(outputDir, "desktop-hero.png");
    await desktopPage.screenshot({
      fullPage: false,
      path: localPath,
      type: "png",
    });
    specs.push({
      height: DESKTOP_VIEWPORT.height,
      label: "Desktop hero",
      localPath,
      viewport: "desktop",
      width: DESKTOP_VIEWPORT.width,
    });

    await desktopContext.close();
  } finally {
    await browser.close();
  }

  return specs;
}

async function storeCapture({
  brandProfileId,
  spec,
  storage,
  workspaceId,
}: {
  brandProfileId: string;
  spec: CaptureSpec;
  storage: ReturnType<typeof createVideoStorageFromEnv>;
  workspaceId: string;
}): Promise<BrandProfileSiteCapture> {
  const key = [
    "captures",
    safePathSegment(workspaceId),
    safePathSegment(brandProfileId),
    `${slugify(spec.label)}-${Date.now()}.png`,
  ].join("/");
  const upload = await storage.put({
    contentType: "image/png",
    key,
    localPath: spec.localPath,
  });

  return {
    height: spec.height,
    key: upload.key,
    label: spec.label,
    url: upload.url,
    viewport: spec.viewport,
    width: spec.width,
  };
}

async function createCaptureTempDir(brandProfileId: string) {
  const directory = path.join(
    os.tmpdir(),
    "fastlane-site-captures",
    safePathSegment(brandProfileId),
    String(Date.now()),
  );

  await mkdir(directory, { recursive: true });

  return directory;
}

function safePathSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "capture"
  );
}
