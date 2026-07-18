import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type BrandProfileScrapedPage = {
  label: "home" | "pricing" | "about";
  url: string;
  title: string | null;
  description: string | null;
  text: string;
  status: number;
};

export const workspacePlan = pgEnum("workspace_plan", [
  "free",
  "starter",
  "growth",
  "pro",
]);

export const workspaceRole = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
]);

export const contentFormat = pgEnum("content_format", [
  "slideshow",
  "wall_of_text",
  "greenscreen_meme",
  "hook_demo",
  "avatar_ugc",
]);

export const contentStatus = pgEnum("content_status", [
  "generated",
  "saved",
  "rejected",
  "scheduled",
  "exported",
  "posted",
]);

export const renderStatus = pgEnum("render_status", [
  "idle",
  "queued",
  "rendering",
  "rendered",
  "failed",
]);

export const avatarKind = pgEnum("avatar_kind", ["library", "custom"]);

export const platform = pgEnum("platform", ["tiktok", "instagram", "youtube"]);

export const calendarSlotStatus = pgEnum("calendar_slot_status", [
  "planned",
  "exported",
  "posted_manual",
]);

export const metricSource = pgEnum("metric_source", ["manual", "csv"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("accounts_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  }),
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verifications_identifier_idx").on(table.identifier),
  }),
);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  plan: workspacePlan("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRole("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workspaceId, table.userId] }),
    userIdIdx: index("workspace_members_user_id_idx").on(table.userId),
  }),
);

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    scrapedSummary: text("scraped_summary"),
    scrapedPages: jsonb("scraped_pages")
      .$type<BrandProfileScrapedPage[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    productDesc: text("product_desc"),
    audience: text("audience"),
    tone: text("tone"),
    painPoints: jsonb("pain_points")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    nicheTags: jsonb("niche_tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    hookAngles: jsonb("hook_angles")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    colors: jsonb("colors")
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    logoUrl: text("logo_url"),
    analysisMetadata: jsonb("analysis_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("brand_profiles_workspace_id_idx").on(
      table.workspaceId,
    ),
  }),
);

export const trendTemplates = pgTable("trend_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  nicheTags: jsonb("niche_tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  structureDescription: text("structure_description").notNull(),
  exampleRef: text("example_ref"),
  remotionTemplateId: text("remotion_template_id").notNull(),
  engagementNotes: text("engagement_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    brandProfileId: uuid("brand_profile_id").references(
      () => brandProfiles.id,
      {
        onDelete: "set null",
      },
    ),
    trendTemplateId: uuid("trend_template_id").references(
      () => trendTemplates.id,
      { onDelete: "set null" },
    ),
    format: contentFormat("format").notNull(),
    status: contentStatus("status").notNull().default("generated"),
    script: jsonb("script")
      .$type<{
        hook?: string;
        slides?: string[];
        lines?: string[];
        caption?: string;
        hashtags?: string[];
      }>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    remotionProps: jsonb("remotion_props")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    renderStatus: renderStatus("render_status").notNull().default("idle"),
    videoUrl: text("video_url"),
    thumbUrl: text("thumb_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("content_items_workspace_id_idx").on(
      table.workspaceId,
    ),
    statusIdx: index("content_items_status_idx").on(table.status),
  }),
);

export const avatars = pgTable(
  "avatars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    kind: avatarKind("kind").notNull(),
    name: text("name").notNull(),
    imageUrls: jsonb("image_urls")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    personaMetadata: jsonb("persona_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("avatars_workspace_id_idx").on(table.workspaceId),
  }),
);

export const humanUgcClips = pgTable("human_ugc_clips", {
  id: uuid("id").defaultRandom().primaryKey(),
  clipUrl: text("clip_url").notNull(),
  styleTags: jsonb("style_tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  genderTags: jsonb("gender_tags")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const calendarSlots = pgTable(
  "calendar_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    platform: platform("platform").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: calendarSlotStatus("status").notNull().default("planned"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    contentItemIdIdx: index("calendar_slots_content_item_id_idx").on(
      table.contentItemId,
    ),
    scheduledAtIdx: index("calendar_slots_scheduled_at_idx").on(
      table.scheduledAt,
    ),
  }),
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("credit_ledger_workspace_id_idx").on(
      table.workspaceId,
    ),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    plan: workspacePlan("plan").notNull(),
    status: text("status").notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("subscriptions_workspace_id_idx").on(
      table.workspaceId,
    ),
  }),
);

export const siteEvents = pgTable(
  "site_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, {
      onDelete: "set null",
    }),
    visitorId: text("visitor_id"),
    eventName: text("event_name").notNull(),
    url: text("url").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmContent: text("utm_content"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("site_events_workspace_id_idx").on(table.workspaceId),
    contentItemIdIdx: index("site_events_content_item_id_idx").on(
      table.contentItemId,
    ),
  }),
);

export const postMetrics = pgTable(
  "post_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    platform: platform("platform").notNull(),
    source: metricSource("source").notNull().default("manual"),
    views: integer("views").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    contentItemIdIdx: index("post_metrics_content_item_id_idx").on(
      table.contentItemId,
    ),
  }),
);
