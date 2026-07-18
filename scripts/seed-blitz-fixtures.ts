import "dotenv/config";

import { and, count, eq } from "drizzle-orm";

import { db, pool } from "../src/lib/db";
import {
  brandProfiles,
  contentItems,
  subscriptions,
  trendTemplates,
  users,
  workspaceMembers,
  workspaces,
} from "../src/lib/db/schema";
import type { ContentFormat, ContentScript } from "../src/lib/content/types";

type Fixture = {
  id: string;
  format: ContentFormat;
  hook: string;
  script: ContentScript;
  remotionProps: Record<string, unknown>;
  trendTemplateId: string;
};

const demoUserId = "blitz-demo-user";
const demoWorkspaceId = "11111111-1111-4111-8111-111111111111";
const demoBrandProfileId = "22222222-2222-4222-8222-222222222222";
const demoSubscriptionId = "33333333-3333-4333-8333-333333333333";

const trendTemplatesByFormat: Record<ContentFormat, string> = {
  avatar_ugc: "44444444-4444-4444-8444-444444444405",
  greenscreen_meme: "44444444-4444-4444-8444-444444444403",
  hook_demo: "44444444-4444-4444-8444-444444444404",
  slideshow: "44444444-4444-4444-8444-444444444401",
  wall_of_text: "44444444-4444-4444-8444-444444444402",
};

const fixtures: Fixture[] = [
  {
    id: "55555555-5555-4555-8555-555555555501",
    format: "slideshow",
    hook: "Your best landing page is hiding three videos",
    script: {
      hook: "Your best landing page is hiding three videos",
      slides: [
        "Start with the first promise above the fold.",
        "Turn each objection into a separate proof card.",
        "End with the CTA your buyers already clicked.",
      ],
      caption:
        "A high-converting page already contains the script. The unlock is packaging each proof point as its own short-form beat.",
      hashtags: ["ugcmarketing", "landingpage", "contentops"],
    },
    remotionProps: {
      template: "slideshow",
      palette: ["#0f172a", "#38bdf8", "#ecfeff"],
      slideCount: 3,
    },
    trendTemplateId: trendTemplatesByFormat.slideshow,
  },
  {
    id: "55555555-5555-4555-8555-555555555502",
    format: "wall_of_text",
    hook: "Stop explaining the feature. Show the moment it saves.",
    script: {
      hook: "Stop explaining the feature. Show the moment it saves.",
      lines: [
        "Nobody shares a feature list.",
        "They share the second a messy task becomes simple.",
        "Write the script around that before-and-after.",
      ],
      caption:
        "Feature-led content drags. Moment-led content gives the viewer a reason to keep watching.",
      hashtags: ["saascontent", "copywriting", "shortform"],
    },
    remotionProps: {
      template: "wall_of_text",
      background: "desk-broll",
      emphasis: "middle_line",
    },
    trendTemplateId: trendTemplatesByFormat.wall_of_text,
  },
  {
    id: "55555555-5555-4555-8555-555555555503",
    format: "greenscreen_meme",
    hook: "When the founder says 'we just need one viral post'",
    script: {
      hook: "When the founder says 'we just need one viral post'",
      lines: [
        "One viral post is not a strategy.",
        "Fifty sharp tests is.",
        "The winner tells you what to make next.",
      ],
      caption:
        "The fastest teams treat creative like experiments, not lottery tickets.",
      hashtags: ["foundermarketing", "creativeops", "growth"],
    },
    remotionProps: {
      template: "greenscreen_meme",
      memeBackground: "boardroom-reaction",
      captionBar: true,
    },
    trendTemplateId: trendTemplatesByFormat.greenscreen_meme,
  },
  {
    id: "55555555-5555-4555-8555-555555555504",
    format: "hook_demo",
    hook: "I rebuilt our best sales call in 22 seconds",
    script: {
      hook: "I rebuilt our best sales call in 22 seconds",
      lines: [
        "Open on the buyer problem.",
        "Cut to the product solving the bottleneck.",
        "Close on the result the buyer repeats back.",
      ],
      caption:
        "Your best sales call already has the order: problem, proof, result.",
      hashtags: ["productdemo", "b2bmarketing", "salesenablement"],
    },
    remotionProps: {
      template: "hook_demo",
      screenRecordingCue: "dashboard-filter",
      endCard: "book_demo",
    },
    trendTemplateId: trendTemplatesByFormat.hook_demo,
  },
  {
    id: "55555555-5555-4555-8555-555555555505",
    format: "slideshow",
    hook: "Three comments that should become ads this week",
    script: {
      hook: "Three comments that should become ads this week",
      slides: [
        "The objection that keeps showing up in demos.",
        "The praise that names a concrete outcome.",
        "The question buyers ask before they convert.",
      ],
      caption:
        "Comment mining turns audience language into creative angles without another brainstorm.",
      hashtags: ["commentmining", "paidads", "creativestrategy"],
    },
    remotionProps: {
      template: "slideshow",
      palette: ["#111827", "#22c55e", "#f8fafc"],
      slideCount: 3,
    },
    trendTemplateId: trendTemplatesByFormat.slideshow,
  },
  {
    id: "55555555-5555-4555-8555-555555555506",
    format: "wall_of_text",
    hook: "The boring metric that predicts your next winner",
    script: {
      hook: "The boring metric that predicts your next winner",
      lines: [
        "Watch saves before you watch likes.",
        "Saves mean the idea is useful enough to revisit.",
        "Useful ideas are easier to turn into campaigns.",
      ],
      caption:
        "Likes are lightweight. Saves show an idea has operational value for the viewer.",
      hashtags: ["contentmetrics", "ugcstrategy", "marketinganalytics"],
    },
    remotionProps: {
      template: "wall_of_text",
      background: "analytics-broll",
      emphasis: "first_line",
    },
    trendTemplateId: trendTemplatesByFormat.wall_of_text,
  },
  {
    id: "55555555-5555-4555-8555-555555555507",
    format: "greenscreen_meme",
    hook: "POV: the ad angle was sitting in onboarding notes",
    script: {
      hook: "POV: the ad angle was sitting in onboarding notes",
      lines: [
        "Customers explain the pain more clearly than your homepage.",
        "Pull the exact phrasing from onboarding notes.",
        "Turn the sharpest sentence into the opening hook.",
      ],
      caption:
        "The best creative research often starts inside support and onboarding.",
      hashtags: ["customerresearch", "ugcads", "marketingops"],
    },
    remotionProps: {
      template: "greenscreen_meme",
      memeBackground: "notes-highlight",
      captionBar: true,
    },
    trendTemplateId: trendTemplatesByFormat.greenscreen_meme,
  },
  {
    id: "55555555-5555-4555-8555-555555555508",
    format: "hook_demo",
    hook: "This one click saves our team 40 minutes",
    script: {
      hook: "This one click saves our team 40 minutes",
      lines: [
        "Show the old workflow in one sentence.",
        "Show the click that replaces it.",
        "Put the time saved on screen before the CTA.",
      ],
      caption:
        "Specific time saved beats vague productivity claims every time.",
      hashtags: ["workflow", "productivitytools", "demovideo"],
    },
    remotionProps: {
      template: "hook_demo",
      screenRecordingCue: "one-click-export",
      endCard: "start_free",
    },
    trendTemplateId: trendTemplatesByFormat.hook_demo,
  },
  {
    id: "55555555-5555-4555-8555-555555555509",
    format: "slideshow",
    hook: "If your trial users stall, make this content",
    script: {
      hook: "If your trial users stall, make this content",
      slides: [
        "Show the first successful outcome.",
        "Show the setup step people avoid.",
        "Show what to do when data looks empty.",
        "Show the upgrade trigger only after proof.",
      ],
      caption:
        "Activation content should remove friction before it asks for expansion.",
      hashtags: ["activation", "saasgrowth", "customereducation"],
    },
    remotionProps: {
      template: "slideshow",
      palette: ["#0f172a", "#14b8a6", "#ffffff"],
      slideCount: 4,
    },
    trendTemplateId: trendTemplatesByFormat.slideshow,
  },
  {
    id: "55555555-5555-4555-8555-555555555510",
    format: "wall_of_text",
    hook: "A better hook formula for niche software",
    script: {
      hook: "A better hook formula for niche software",
      lines: [
        "Name the role.",
        "Name the recurring mess.",
        "Name the avoided consequence.",
        "Then show the product.",
      ],
      caption:
        "Niche software wins when the viewer feels recognized in the first line.",
      hashtags: ["hookwriting", "nichesaas", "ugc"],
    },
    remotionProps: {
      template: "wall_of_text",
      background: "editorial-broll",
      emphasis: "sequence",
    },
    trendTemplateId: trendTemplatesByFormat.wall_of_text,
  },
  {
    id: "55555555-5555-4555-8555-555555555511",
    format: "greenscreen_meme",
    hook: "Marketers after turning one webinar into 19 clips",
    script: {
      hook: "Marketers after turning one webinar into 19 clips",
      lines: [
        "The webinar already has expert proof.",
        "Cut objections into standalone clips.",
        "Cut demos into product proof.",
        "Cut Q&A into search-led answers.",
      ],
      caption:
        "Long-form assets are raw material. The feed needs narrower cuts.",
      hashtags: ["webinarrepurposing", "contentrepurposing", "b2b"],
    },
    remotionProps: {
      template: "greenscreen_meme",
      memeBackground: "celebration-cut",
      captionBar: true,
    },
    trendTemplateId: trendTemplatesByFormat.greenscreen_meme,
  },
  {
    id: "55555555-5555-4555-8555-555555555512",
    format: "hook_demo",
    hook: "Watch me turn a messy brief into a ready-to-shoot script",
    script: {
      hook: "Watch me turn a messy brief into a ready-to-shoot script",
      lines: [
        "Paste the brief.",
        "Extract the buyer pain.",
        "Choose the proof point.",
        "Export the script with caption and hashtags.",
      ],
      caption:
        "Creative briefs become faster when extraction and formatting happen in one flow.",
      hashtags: ["creativebrief", "ugcworkflow", "marketingtool"],
    },
    remotionProps: {
      template: "hook_demo",
      screenRecordingCue: "script-builder",
      endCard: "try_blitz",
    },
    trendTemplateId: trendTemplatesByFormat.hook_demo,
  },
  {
    id: "55555555-5555-4555-8555-555555555513",
    format: "slideshow",
    hook: "Five proof points hiding on your site",
    script: {
      hook: "Five proof points hiding on your site",
      slides: [
        "Customer logos",
        "A named time savings claim",
        "A before-and-after screenshot",
        "A pricing objection",
        "A support quote with emotion",
      ],
      caption:
        "Proof is usually already published. Short-form needs it sequenced for fast trust.",
      hashtags: ["socialproof", "websiteaudit", "videomarketing"],
    },
    remotionProps: {
      template: "slideshow",
      palette: ["#111827", "#06b6d4", "#f9fafb"],
      slideCount: 5,
    },
    trendTemplateId: trendTemplatesByFormat.slideshow,
  },
  {
    id: "55555555-5555-4555-8555-555555555514",
    format: "wall_of_text",
    hook: "The content calendar mistake that slows teams down",
    script: {
      hook: "The content calendar mistake that slows teams down",
      lines: [
        "Calendars should not start with dates.",
        "They should start with hypotheses.",
        "Schedule the tests, then scale the winners.",
      ],
      caption: "A calendar full of untested ideas is just organized guessing.",
      hashtags: ["contentcalendar", "growthmarketing", "creativeops"],
    },
    remotionProps: {
      template: "wall_of_text",
      background: "calendar-broll",
      emphasis: "last_line",
    },
    trendTemplateId: trendTemplatesByFormat.wall_of_text,
  },
  {
    id: "55555555-5555-4555-8555-555555555515",
    format: "greenscreen_meme",
    hook: "When the lowest effort variant beats the polished ad",
    script: {
      hook: "When the lowest effort variant beats the polished ad",
      lines: [
        "Polish does not always create trust.",
        "Specificity does.",
        "Ship the rough variant if the point is clearer.",
      ],
      caption:
        "The feed rewards clarity before production value. Test the simple version.",
      hashtags: ["ugcads", "creativetesting", "paidgrowth"],
    },
    remotionProps: {
      template: "greenscreen_meme",
      memeBackground: "surprised-metrics",
      captionBar: true,
    },
    trendTemplateId: trendTemplatesByFormat.greenscreen_meme,
  },
];

async function seed() {
  const now = new Date();

  await db
    .insert(users)
    .values({
      id: demoUserId,
      name: "Blitz Demo User",
      email: "blitz-demo@example.com",
      emailVerified: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: "Blitz Demo User",
        emailVerified: true,
        updatedAt: now,
      },
    });

  await db
    .insert(workspaces)
    .values({
      id: demoWorkspaceId,
      name: "Blitz Demo Workspace",
      plan: "starter",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: workspaces.id,
      set: {
        name: "Blitz Demo Workspace",
        plan: "starter",
        updatedAt: now,
      },
    });

  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: demoWorkspaceId,
      userId: demoUserId,
      role: "owner",
    })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: {
        role: "owner",
      },
    });

  await db
    .insert(subscriptions)
    .values({
      id: demoSubscriptionId,
      workspaceId: demoWorkspaceId,
      stripeSubscriptionId: "sub_blitz_demo",
      stripeCustomerId: "cus_blitz_demo",
      plan: "starter",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        plan: "starter",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    });

  await db
    .insert(brandProfiles)
    .values({
      id: demoBrandProfileId,
      workspaceId: demoWorkspaceId,
      url: "https://example.com",
      scrapedSummary:
        "A fast content operations product that converts landing page proof into short-form UGC concepts.",
      productDesc:
        "Fastlane turns site messaging, customer proof, and product demos into testable short-form scripts.",
      audience:
        "Growth marketers, founders, and content teams shipping frequent creative tests.",
      tone: "Direct, specific, practical, and proof-led.",
      nicheTags: ["ugc", "creative-ops", "saas", "short-form"],
      colors: {
        accent: "#0ea5e9",
        foreground: "#0f172a",
        secondary: "#10b981",
      },
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: brandProfiles.id,
      set: {
        scrapedSummary:
          "A fast content operations product that converts landing page proof into short-form UGC concepts.",
        productDesc:
          "Fastlane turns site messaging, customer proof, and product demos into testable short-form scripts.",
        audience:
          "Growth marketers, founders, and content teams shipping frequent creative tests.",
        tone: "Direct, specific, practical, and proof-led.",
        nicheTags: ["ugc", "creative-ops", "saas", "short-form"],
        colors: {
          accent: "#0ea5e9",
          foreground: "#0f172a",
          secondary: "#10b981",
        },
        updatedAt: now,
      },
    });

  await db
    .insert(trendTemplates)
    .values([
      {
        id: trendTemplatesByFormat.slideshow,
        title: "Proof Point Slideshow",
        nicheTags: ["ugc", "education", "social-proof"],
        structureDescription:
          "A fast hook followed by three to five proof cards and a crisp CTA.",
        remotionTemplateId: "slideshow",
        engagementNotes: "Best for save-worthy tactical ideas.",
        updatedAt: now,
      },
      {
        id: trendTemplatesByFormat.wall_of_text,
        title: "Wall of Text Insight",
        nicheTags: ["copywriting", "contrarian", "saas"],
        structureDescription:
          "A bold thesis, two supporting lines, and a memorable final line over b-roll.",
        remotionTemplateId: "wall_of_text",
        engagementNotes: "Best for sharp POVs and quotable advice.",
        updatedAt: now,
      },
      {
        id: trendTemplatesByFormat.greenscreen_meme,
        title: "Green Screen Meme Reaction",
        nicheTags: ["meme", "founder", "growth"],
        structureDescription:
          "A familiar reaction setup followed by a practical marketing takeaway.",
        remotionTemplateId: "greenscreen_meme",
        engagementNotes: "Best when the first line names a shared frustration.",
        updatedAt: now,
      },
      {
        id: trendTemplatesByFormat.hook_demo,
        title: "Hook Plus Demo",
        nicheTags: ["product-demo", "saas", "workflow"],
        structureDescription:
          "A concrete hook, short workflow demonstration, and result-led CTA.",
        remotionTemplateId: "hook_demo",
        engagementNotes: "Best for feature moments with measurable outcomes.",
        updatedAt: now,
      },
    ])
    .onConflictDoUpdate({
      target: trendTemplates.id,
      set: {
        updatedAt: now,
      },
    });

  await db
    .insert(contentItems)
    .values(
      fixtures.map((fixture, index) => ({
        id: fixture.id,
        workspaceId: demoWorkspaceId,
        brandProfileId: demoBrandProfileId,
        trendTemplateId: fixture.trendTemplateId,
        format: fixture.format,
        status: "generated" as const,
        script: fixture.script,
        remotionProps: fixture.remotionProps,
        renderStatus: "idle" as const,
        thumbUrl: null,
        videoUrl: null,
        createdAt: new Date(now.getTime() - index * 60 * 1000),
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: contentItems.id,
      set: {
        status: "generated",
        renderStatus: "idle",
        thumbUrl: null,
        videoUrl: null,
        updatedAt: now,
      },
    });

  const [generated] = await db
    .select({ value: count() })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.workspaceId, demoWorkspaceId),
        eq(contentItems.status, "generated"),
      ),
    );

  console.log(
    `Seeded ${fixtures.length} Blitz fixtures for "${demoWorkspaceId}". Generated rows now available: ${
      generated?.value ?? 0
    }.`,
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
