# Fastlane Clone

UGC marketing SaaS clone of usefastlane.ai: website URL → AI brand profile → batch-generated short-form video (Remotion) → Blitz swipe UI → calendar → export. Full plan and phase breakdown in `plan.md`.

## Every session

- Read `workflows/lessons.md` (append-only mistake log) before starting work. Append a lesson whenever a mistake costs time.

## Stack

- Next.js 15 App Router (TS), Tailwind + shadcn/ui
- Postgres + Drizzle ORM (docker-compose for local), Redis + BullMQ worker in `worker/`
- Remotion: `@remotion/player` for preview, `@remotion/renderer` in worker for MP4s
- better-auth, Cloudflare R2 (S3 API), Stripe
- LLM calls go through Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) — never langchain or raw API-key SDK clients

## Conventions

- Branch flow: `feature/*` → PR into `staging` → PR `staging` into `main`. No direct commits to main/staging.
- Commit messages: short and simple, no Co-Authored-By footers.
- Git remotes: SSH only (`git@`).
- Major coding tasks are implemented by Codex; Claude Code writes specs, reviews, and glue.
- Video output spec: 1080×1920, 30fps, MP4 (H.264).

## Commands

- `pnpm dev` — app; `pnpm worker` — render/scrape worker
- `docker compose up -d` — Postgres + Redis
- `pnpm db:migrate` / `pnpm db:studio` — Drizzle
- `pnpm golden` — render and verify Remotion golden fixtures into `.renders/golden/` as a local/pre-PR check; not in CI yet
