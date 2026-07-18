import "dotenv/config";

import { db, pool } from "../src/lib/db";
import { calendarSlots, contentItems, workspaces } from "../src/lib/db/schema";

type ContentItemInsert = typeof contentItems.$inferInsert;
type CalendarSlotInsert = typeof calendarSlots.$inferInsert;

const demoWorkspaceId = "00000000-0000-4000-8000-000000000404";
const landingPageUrl = "https://fastlane-demo.local/ugc-generator";

const itemIds = Array.from(
  { length: 12 },
  (_value, index) =>
    `11111111-1111-4111-8111-${String(index + 1).padStart(12, "0")}`,
);

const slotIds = Array.from(
  { length: 6 },
  (_value, index) =>
    `22222222-2222-4222-8222-${String(index + 1).padStart(12, "0")}`,
);

const now = new Date();

const fixtureItems: ContentItemInsert[] = [
  {
    id: itemIds[0],
    workspaceId: demoWorkspaceId,
    format: "hook_demo",
    status: "saved",
    script: {
      hook: "Your landing page is leaking buyers",
      lines: [
        "Three seconds to explain the product",
        "One scroll to prove the outcome",
        "A clear CTA before they bounce",
      ],
      caption:
        "Turn a messy landing page into a short-form hook that gets watched.",
      hashtags: ["#ugc", "#saas", "#growth"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "hook-demo-v1",
      palette: ["#111827", "#0ea5e9", "#10b981"],
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(1),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[1],
    workspaceId: demoWorkspaceId,
    format: "slideshow",
    status: "saved",
    script: {
      hook: "Five hooks your competitor is already testing",
      slides: [
        "Promise a specific outcome",
        "Show the before state",
        "Name the hidden cost",
        "Use one proof point",
        "End with the next click",
      ],
      caption: "Steal the structure, not the copy.",
      hashtags: ["#contentmarketing", "#shortform", "#founders"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "slideshow-v1",
      slideCount: 5,
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(2),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[2],
    workspaceId: demoWorkspaceId,
    format: "wall_of_text",
    status: "saved",
    script: {
      hook: "Nobody cares about your feature list",
      lines: [
        "They care about the job it finishes",
        "They care about the risk it removes",
        "They care about looking smart for choosing it",
      ],
      caption: "Feature-first copy slows down high-intent buyers.",
      hashtags: ["#copywriting", "#b2bmarketing", "#creatorops"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "wall-text-v1",
      mood: "direct",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(3),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[3],
    workspaceId: demoWorkspaceId,
    format: "greenscreen_meme",
    status: "saved",
    script: {
      hook: "When the founder says organic is free",
      lines: [
        "The content calendar",
        "The edits",
        "The captions",
        "The analytics report",
      ],
      caption: "Organic is a system, not a free channel.",
      hashtags: ["#startupmarketing", "#socialmedia", "#ops"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "greenscreen-v1",
      memeRef: "founder-organic",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(4),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[4],
    workspaceId: demoWorkspaceId,
    format: "avatar_ugc",
    status: "saved",
    script: {
      hook: "I tried rebuilding my weekly content system",
      lines: [
        "Batch the ideas",
        "Approve the winners",
        "Export the posts with tracking",
      ],
      caption: "A repeatable UGC workflow beats random posting.",
      hashtags: ["#ugcworkflow", "#marketingtools", "#ai"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "avatar-ugc-stub-v1",
      avatarName: "Maya",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(5),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[5],
    workspaceId: demoWorkspaceId,
    format: "hook_demo",
    status: "saved",
    script: {
      hook: "The fastest way to find your next winning ad",
      lines: [
        "Start with saved hooks",
        "Schedule by platform",
        "Export with tracking",
      ],
      caption:
        "Creative velocity is easier when approvals and posting live together.",
      hashtags: ["#paidsocial", "#creativetesting", "#marketing"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "hook-demo-v1",
      angle: "creative velocity",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(6),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[6],
    workspaceId: demoWorkspaceId,
    format: "slideshow",
    status: "saved",
    script: {
      hook: "Three posts every SaaS launch needs",
      slides: [
        "The painful old workflow",
        "The product aha moment",
        "The proof-backed CTA",
      ],
      caption: "Launch week content should remove doubt, not just announce.",
      hashtags: ["#saaslaunch", "#productmarketing", "#ugc"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "slideshow-v1",
      slideCount: 3,
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(7),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[7],
    workspaceId: demoWorkspaceId,
    format: "wall_of_text",
    status: "saved",
    script: {
      hook: "If your CTA says learn more, rewrite it",
      lines: [
        "Make the action concrete",
        "Tie it to a visible payoff",
        "Keep the next step tiny",
      ],
      caption: "Specific CTAs make short-form traffic easier to attribute.",
      hashtags: ["#landingpages", "#conversion", "#growthmarketing"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "wall-text-v1",
      mood: "tactical",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(8),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[8],
    workspaceId: demoWorkspaceId,
    format: "greenscreen_meme",
    status: "saved",
    script: {
      hook: "POV: the post finally sends qualified traffic",
      lines: [
        "The caption has the offer",
        "The link has the UTM",
        "The dashboard shows the signup",
      ],
      caption: "Attribution starts before the post goes live.",
      hashtags: ["#analytics", "#shorts", "#reels"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "greenscreen-v1",
      memeRef: "qualified-traffic",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(9),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[9],
    workspaceId: demoWorkspaceId,
    format: "avatar_ugc",
    status: "saved",
    script: {
      hook: "Here is how I plan a week of UGC in one pass",
      lines: [
        "Pick the channel",
        "Drop the saved creative",
        "Export when the slot is ready",
      ],
      caption: "A calendar is the bridge between ideas and distribution.",
      hashtags: ["#ugccontent", "#contentcalendar", "#marketingops"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "avatar-ugc-stub-v1",
      avatarName: "Devon",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(10),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[10],
    workspaceId: demoWorkspaceId,
    format: "hook_demo",
    status: "saved",
    script: {
      hook: "This is why your best post needs three cuts",
      lines: [
        "TikTok wants the raw hook",
        "Reels wants the tighter proof",
        "Shorts wants the clearest search angle",
      ],
      caption: "Same idea, different platform packaging.",
      hashtags: ["#tiktokmarketing", "#reelsstrategy", "#youtubeshorts"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "hook-demo-v1",
      angle: "platform variants",
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(11),
    thumbUrl: null,
    updatedAt: now,
  },
  {
    id: itemIds[11],
    workspaceId: demoWorkspaceId,
    format: "slideshow",
    status: "saved",
    script: {
      hook: "A simple weekly cadence for founder-led content",
      slides: [
        "Monday: problem post",
        "Wednesday: product proof",
        "Friday: customer story",
      ],
      caption:
        "Consistency gets easier when the calendar already has the slots.",
      hashtags: ["#founderled", "#socialstrategy", "#contentops"],
    },
    remotionProps: {
      landingPageUrl,
      templateId: "slideshow-v1",
      slideCount: 3,
    },
    renderStatus: "rendered",
    videoUrl: fixtureVideoUrl(12),
    thumbUrl: null,
    updatedAt: now,
  },
];

const fixtureSlots: CalendarSlotInsert[] = [
  {
    id: slotIds[0],
    contentItemId: itemIds[0],
    platform: "tiktok",
    scheduledAt: scheduledAt(1, 10),
    status: "planned",
    updatedAt: now,
  },
  {
    id: slotIds[1],
    contentItemId: itemIds[1],
    platform: "instagram",
    scheduledAt: scheduledAt(2, 14),
    status: "planned",
    updatedAt: now,
  },
  {
    id: slotIds[2],
    contentItemId: itemIds[2],
    platform: "youtube",
    scheduledAt: scheduledAt(3, 18),
    status: "planned",
    updatedAt: now,
  },
  {
    id: slotIds[3],
    contentItemId: itemIds[3],
    platform: "tiktok",
    scheduledAt: scheduledAt(4, 10),
    status: "planned",
    updatedAt: now,
  },
  {
    id: slotIds[4],
    contentItemId: itemIds[4],
    platform: "instagram",
    scheduledAt: scheduledAt(5, 14),
    status: "planned",
    updatedAt: now,
  },
  {
    id: slotIds[5],
    contentItemId: itemIds[5],
    platform: "youtube",
    scheduledAt: scheduledAt(6, 18),
    status: "planned",
    updatedAt: now,
  },
];

async function seed() {
  await db
    .insert(workspaces)
    .values({
      id: demoWorkspaceId,
      name: "Fastlane Demo Workspace",
      plan: "growth",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: workspaces.id,
      set: {
        name: "Fastlane Demo Workspace",
        plan: "growth",
        updatedAt: now,
      },
    });

  for (const item of fixtureItems) {
    await db
      .insert(contentItems)
      .values(item)
      .onConflictDoUpdate({
        target: contentItems.id,
        set: {
          workspaceId: item.workspaceId,
          format: item.format,
          status: item.status,
          script: item.script,
          remotionProps: item.remotionProps,
          renderStatus: item.renderStatus,
          videoUrl: item.videoUrl,
          thumbUrl: item.thumbUrl,
          updatedAt: now,
        },
      });
  }

  for (const slot of fixtureSlots) {
    await db
      .insert(calendarSlots)
      .values(slot)
      .onConflictDoUpdate({
        target: calendarSlots.id,
        set: {
          contentItemId: slot.contentItemId,
          platform: slot.platform,
          scheduledAt: slot.scheduledAt,
          status: slot.status,
          updatedAt: now,
        },
      });
  }

  console.log(
    `Seeded ${fixtureItems.length} content items and ${fixtureSlots.length} calendar slots for ${demoWorkspaceId}.`,
  );
}

function fixtureVideoUrl(index: number) {
  return `/calendar/fixture-video/fastlane-fixture-${String(index).padStart(
    2,
    "0",
  )}.mp4`;
}

function scheduledAt(dayOffsetFromWeekStart: number, hour: number) {
  const date = startOfWeek(new Date());
  date.setDate(date.getDate() + dayOffsetFromWeekStart);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function startOfWeek(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart;
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
