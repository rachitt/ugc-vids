# Fastlane Clone — Full Product Plan

## Context

Clone [usefastlane.ai](https://www.usefastlane.ai/) — a UGC marketing SaaS that turns a website URL into ready-to-post short-form video content (TikTok / IG Reels / YT Shorts). Repo: `/Users/rachit/Documents/ideas/fastlane` (currently empty).

**What Fastlane does (from research):**
1. **Brand profile**: user enters website URL → AI learns product, audience, tone
2. **Content engine**: auto-generates batches of content in 4 formats — TikTok slideshows, green-screen memes, wall-of-text videos, hook+demo showcases — plus AI-avatar UGC videos
3. **Blitz Mode**: Tinder-style swipe UI over generated content; right-swipe = save/schedule
4. **Libraries**: 500+ AI UGC avatars, 2000+ human UGC clips, trending-content library tagged by niche for remixing
5. **AI Influencer Studio**: prompt-created consistent character; credit-metered (4 credits/image, 10 credits/sec video)
6. **Calendar + scheduling**: one-click publish to TikTok/IG/YT
7. **Analytics**: per-post metrics + website-traffic attribution
8. **Plans**: Free / $29 Starter / $49 Growth / $149 Pro; workspaces (1/3/10); content-save caps; AI studio credits

**Scoping decisions (user-confirmed):**
- **Full clone** feature breadth, phased
- **Remotion-only video generation first** — programmatic React video for all template formats; gen-AI avatar video (fal.ai etc.) architected-for but deferred
- **Export-only publishing in v1** — download video + caption; direct/3rd-party platform APIs later
- **Next.js monolith** stack

## Stack

- **App**: Next.js 15 (App Router, TS), Tailwind + shadcn/ui
- **DB**: Postgres + Drizzle ORM (local dev via Docker; Supabase/Neon in prod)
- **Auth**: better-auth (email + Google)
- **Jobs**: BullMQ + Redis worker process (render jobs, scrape jobs) — lives in same repo, `worker/` entry
- **Video**: Remotion (`@remotion/renderer` on the worker; `@remotion/player` for in-browser preview so most UX never waits on a render)
- **LLM**: Claude Agent SDK (per user preference — no raw API keys/langchain) for brand analysis, script/hook/caption generation
- **Storage**: Cloudflare R2 (S3 API) for rendered MP4s, images, avatar assets
- **Billing**: none — CUT (user directive); plan caps/credits are free defaults only
- Repo hygiene per user's standing prefs: `CLAUDE.md` + `workflows/lessons.md` (append-only), branch flow `feature → staging → main`, short commit messages, SSH remotes

## Data model (Drizzle schema, core tables)

- `users`, `sessions` (better-auth)
- `workspaces` (plan-limited: 1/3/10), `workspace_members`
- `brand_profiles` — workspace FK; url, scraped_summary, product_desc, audience, tone, niche tags, colors/logo
- `content_items` — workspace FK; format enum (`slideshow` | `wall_of_text` | `greenscreen_meme` | `hook_demo` | `avatar_ugc`), status (`generated` | `saved` | `rejected` | `scheduled` | `exported` | `posted`), script JSON (hook, slides/lines, caption, hashtags), remotion_props JSON, render_status, video_url, thumb_url
- `trend_templates` — curated trending formats: niche tags, structure description, example ref, remotion template id, engagement notes
- `avatars` — kind (`library` | `custom`), image URLs, persona metadata; `human_ugc_clips` — clip URL, style/gender tags
- `calendar_slots` — content_item FK, platform enum, scheduled_at, status (`planned` | `exported` | `posted_manual`)
- `credit_ledger` — workspace FK, delta, reason; `subscriptions` — stripe ids, plan, period
- `site_events` — attribution: pixel/snippet events (visitor, signup) with utm/ref → content_item mapping
- `post_metrics` — manual or CSV-imported views/likes/comments per posted item

## Phases

### Phase 0 — Scaffold
Next.js app, Drizzle + Postgres docker-compose, Redis, better-auth, shadcn, R2 client, worker process skeleton, `CLAUDE.md`, `workflows/lessons.md`, staging/main branches.

### Phase 1 — Brand profile engine
- URL intake → scrape (fetch + readability parse of landing page, plus /pricing, /about when present)
- Claude Agent SDK prompt → structured brand profile (product, ICP, tone, pain points, niche tags, 20+ hook angles)
- Editable profile UI (user can correct tone/audience)

### Phase 2 — Content engine + Remotion renderer (the core)
- **Remotion templates (4)**: slideshow (image cards + captions + music), wall-of-text (screenshot-style text over b-roll/gradient), green-screen meme (persona cutout over meme background + caption bar), hook+demo (hook text card → screen-recording/product shots)
- Generation pipeline: brand profile + trend_template → Claude generates N scripts (hook, body, caption, hashtags) → mapped to `remotion_props` → `content_items` rows
- Preview via `@remotion/player` (instant, free); render to MP4 via worker + BullMQ only on save/export
- Batch generation endpoint: "generate 50 items" fan-out
- Asset seeding: bundle CC0 music beds, gradient/meme backgrounds, stock b-roll

### Phase 3 — Blitz Mode + content library
- Swipe deck UI (framer-motion drag): right = save, left = reject; infinite feed backed by batch generation
- Library view of saved items with plan-based save caps (20/100/unlimited)
- "More like this": right-swipes feed a preference signal → regenerate variants of winners

### Phase 4 — Calendar + export publishing
- Drag-drop content calendar (week/month), platform tags per slot
- Export flow: trigger render → download MP4 + copy-ready caption/hashtags; mark slot `posted_manual`
- Publishing abstraction layer (`Publisher` interface) so 3rd-party/direct APIs slot in later without refactor

### Phase 5 — Trending library + remix
- Curated `trend_templates` admin: seed ~50 trends manually (niche-tagged, each mapped to a Remotion template + prompt recipe)
- Browse/filter UI by niche; "Remix" = run generation pipeline with that template against your brand profile

### Phase 6 — AI Influencer Studio + avatar/human UGC libraries (credit-metered)
- Avatar library: seed with generated character images (batch via image API or curated CC0 set)
- Custom influencer: prompt → character sheet (consistent face via image-gen with reference); stored per workspace
- Credit system live: ledger, 4/credit image, 10/credit video-second, plan allowances (10/250/500/2000)
- **Avatar *video* (talking head) stays stubbed**: architecture + `avatar_ugc` format exist; render adapter behind a feature flag ready for fal.ai (image-to-video + TTS + lipsync) in a later phase
- Human UGC clip library: seeded/curated clips, style+gender filters, usable as hook footage in templates

### ~~Phase 7 — Billing~~ — CUT (user directive 2026-07-19)
**No billing in this app, ever.** No Stripe checkout/portal/webhooks/paywalls. Plan caps and credit allowances remain as free defaults; do not build payment flows or propose them.

### Phase 8 — Analytics + attribution
- Embeddable site snippet → `site_events` with utm auto-tagging on exported captions (`?utm_source=tiktok&utm_content={item_id}`)
- Manual/CSV post-metrics entry per published item (until platform APIs exist)
- Dashboard: top content, saves→posts funnel, visitors/signups attributed per item; "double down" button → regenerate variants of winners

### Deferred (post-v1, architected for)
- Real publishing: 3rd-party post API (upload-post/Blotato) behind `Publisher` interface, then direct TikTok/IG/YT apps
- Gen-AI avatar videos via fal.ai (Veo/Kling + ElevenLabs + lipsync)
- Platform analytics ingestion, API/MCP surface, whitelabel, warmed-accounts marketplace (likely never — ToS-gray)

## Verification

- Per phase: `pnpm build` + Playwright smoke of the new flow
- E2E core loop (Phase 2-4 done): enter a real URL (e.g. one of user's own projects) → profile generated → Blitz-swipe 10 items → save 3 → render → download MP4 and play it → verify caption/hashtags copy
- Render worker: golden-test each Remotion template with fixture props, assert MP4 duration/dimensions (1080×1920)
- Credits: credit ledger decrements on studio use (no billing — cut)
- Attribution: hit snippet-tagged URL locally → event row appears with correct content_item

## Execution notes

- **Codex runs all major coding tasks** (per user directive): each phase's implementation is handed to Codex (via the `codex` plugin subagent locally, or Codex sessions in parallel worktrees). Claude Code does the planning, task specs, integration review, and small glue fixes.
- Phases 2 (templates), 5 (trend curation), 6 (studio) are parallelizable across worktrees per user's workflow after Phase 0-1 land
- Biggest risk: Remotion template quality decides whether output feels "viral-native" vs generic — invest iteration time there before breadth
