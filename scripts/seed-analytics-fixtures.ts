import "dotenv/config";

import { eq, inArray } from "drizzle-orm";

import { db, pool } from "../src/lib/db";
import {
  contentItems,
  postMetrics,
  siteEvents,
  workspaces,
} from "../src/lib/db/schema";

const demoWorkspaceId = "8c3e2f7e-9b21-4d70-9b7e-4a32c38c2e10";

const demoContentItems = [
  {
    id: "4d773d5d-66da-4bdb-9246-ef96a37ec155",
    format: "hook_demo" as const,
    status: "posted" as const,
    hook: "Stop losing buyers after the click",
    caption: "A quick landing-page teardown for founders shipping weekly.",
  },
  {
    id: "e7bd3a79-2a1f-4fb5-9a7a-86b58dcfbf39",
    format: "slideshow" as const,
    status: "posted" as const,
    hook: "Three screenshots that sold the launch",
    caption: "Swipe-worthy proof points for a new product release.",
  },
  {
    id: "5e25c2e8-4d73-4a34-a661-16f6df845c3a",
    format: "wall_of_text" as const,
    status: "exported" as const,
    hook: "The pricing page mistake nobody notices",
    caption: "A direct response post built from customer objections.",
  },
  {
    id: "5ca70be7-2f3b-47b3-b3de-ecbb5011ec62",
    format: "greenscreen_meme" as const,
    status: "saved" as const,
    hook: "POV: the demo finally matches the ad",
    caption: "A remixable meme for product-led teams.",
  },
  {
    id: "03bbd5f6-565e-4df5-83e2-a79220e0fb70",
    format: "avatar_ugc" as const,
    status: "scheduled" as const,
    hook: "I tried replacing a content agency with AI",
    caption: "A creator-style testimonial script for Shorts.",
  },
];

const metricFixtures = [
  {
    contentItemId: demoContentItems[0].id,
    platform: "tiktok" as const,
    views: 42800,
    likes: 3900,
    comments: 188,
  },
  {
    contentItemId: demoContentItems[0].id,
    platform: "instagram" as const,
    views: 18400,
    likes: 1510,
    comments: 64,
  },
  {
    contentItemId: demoContentItems[1].id,
    platform: "youtube" as const,
    views: 32700,
    likes: 2180,
    comments: 121,
  },
  {
    contentItemId: demoContentItems[2].id,
    platform: "instagram" as const,
    views: 14600,
    likes: 980,
    comments: 47,
  },
  {
    contentItemId: demoContentItems[3].id,
    platform: "tiktok" as const,
    views: 7600,
    likes: 630,
    comments: 29,
  },
];

async function main() {
  const now = new Date();
  const contentItemIds = demoContentItems.map((item) => item.id);

  await db
    .insert(workspaces)
    .values({
      id: demoWorkspaceId,
      name: "Fastlane Analytics Demo",
      plan: "growth",
    })
    .onConflictDoUpdate({
      set: {
        name: "Fastlane Analytics Demo",
        plan: "growth",
        updatedAt: now,
      },
      target: workspaces.id,
    });

  for (const item of demoContentItems) {
    await db
      .insert(contentItems)
      .values({
        id: item.id,
        workspaceId: demoWorkspaceId,
        format: item.format,
        status: item.status,
        script: {
          caption: item.caption,
          hashtags: ["#ugc", "#growth", "#shorts"],
          hook: item.hook,
        },
        remotionProps: {
          accentColor: "#06b6d4",
          headline: item.hook,
        },
        renderStatus: item.status === "posted" ? "rendered" : "idle",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        set: {
          format: item.format,
          renderStatus: item.status === "posted" ? "rendered" : "idle",
          script: {
            caption: item.caption,
            hashtags: ["#ugc", "#growth", "#shorts"],
            hook: item.hook,
          },
          status: item.status,
          updatedAt: now,
        },
        target: contentItems.id,
      });
  }

  await db.delete(postMetrics).where(inArray(postMetrics.contentItemId, contentItemIds));
  await db.delete(siteEvents).where(eq(siteEvents.workspaceId, demoWorkspaceId));

  await db.insert(postMetrics).values(
    metricFixtures.map((metric, index) => ({
      ...metric,
      capturedAt: daysAgo(index + 1),
      source: "manual" as const,
    })),
  );

  await db.insert(siteEvents).values(buildSiteEventFixtures());

  console.log(`Seeded analytics fixtures for workspace ${demoWorkspaceId}`);
}

function buildSiteEventFixtures() {
  const events: (typeof siteEvents.$inferInsert)[] = [];

  addTraffic(events, {
    contentItemId: demoContentItems[0].id,
    signups: 19,
    source: "tiktok",
    visitors: 132,
  });
  addTraffic(events, {
    contentItemId: demoContentItems[1].id,
    signups: 11,
    source: "shorts",
    visitors: 87,
  });
  addTraffic(events, {
    contentItemId: demoContentItems[2].id,
    signups: 6,
    source: "reels",
    visitors: 54,
  });
  addTraffic(events, {
    contentItemId: demoContentItems[3].id,
    signups: 2,
    source: "tiktok",
    visitors: 31,
  });

  return events;
}

function addTraffic(
  events: (typeof siteEvents.$inferInsert)[],
  {
    contentItemId,
    signups,
    source,
    visitors,
  }: {
    contentItemId: string;
    signups: number;
    source: string;
    visitors: number;
  },
) {
  for (let index = 0; index < visitors; index += 1) {
    const visitorId = `demo-${source}-${contentItemId.slice(0, 8)}-${index}`;

    events.push({
      workspaceId: demoWorkspaceId,
      contentItemId,
      createdAt: daysAgo((index % 10) + 1),
      eventName: "page_view",
      metadata: {
        fixture: true,
        title: "Demo landing page",
      },
      referrer: `https://${source}.example/ref`,
      url: `https://demo.fastlane.test/signup?utm_source=${source}&utm_content=${contentItemId}`,
      utmContent: contentItemId,
      utmSource: source,
      visitorId,
    });

    if (index < signups) {
      events.push({
        workspaceId: demoWorkspaceId,
        contentItemId,
        createdAt: daysAgo(index + 1),
        eventName: "signup",
        metadata: {
          fixture: true,
          planIntent: index % 2 === 0 ? "growth" : "starter",
        },
        referrer: `https://${source}.example/ref`,
        url: `https://demo.fastlane.test/signup?utm_source=${source}&utm_content=${contentItemId}`,
        utmContent: contentItemId,
        utmSource: source,
        visitorId,
      });
    }
  }
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(16, 0, 0, 0);
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
