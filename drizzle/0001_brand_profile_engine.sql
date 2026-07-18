ALTER TABLE "brand_profiles" ADD COLUMN "scraped_pages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "pain_points" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "hook_angles" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD COLUMN "analysis_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
