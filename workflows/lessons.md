# Lessons (append-only)

Mistakes and their fixes. Read at the start of every session. Append, never rewrite.

- 2026-07-18: Project started. No lessons yet.
- 2026-07-18: Port 5432 on this machine is owned by a system EDB PostgreSQL 18 (`/Library/PostgreSQL/18`, password auth). Local dev uses brew postgresql@17 on **port 5433** (trust auth, role/db `fastlane`). `.env` reflects 5433; docker-compose still maps 5432 for machines without the conflict.
- 2026-07-18: pnpm 11 ignores `pnpm.onlyBuiltDependencies` in package.json — native build approvals live in `pnpm-workspace.yaml` under `allowBuilds`.
- 2026-07-18: Codex sandbox has no network — it cannot run `pnpm install` or anything package-backed. Have Codex write code + configs; run installs/builds/tests outside afterward.
- 2026-07-18: A wedged `next dev` (listening but unresponsive) on port 3000 makes Playwright's webServer wait time out. Kill stray listeners on 3000/3001 before `pnpm test:e2e`.
- 2026-07-18: This repo has Next.js typed routes enabled — computed string hrefs fail `next build` (but pass bare `tsc --noEmit`, so Codex misses them). Use `href={{ pathname, query }}` objects for dynamic links, and always run `pnpm build` as the integration gate.
- 2026-07-18: Never hand-roll Remotion's browser runtime with esbuild — the renderer's headless page expects internal hooks (`remotion_collectAssets` etc.). Use `@remotion/bundler` + `registerRoot`; pin it to the same version as remotion/@remotion/renderer (4.0.490).
- 2026-07-18: `cmd | tail` in zsh returns tail's exit code, so `&&` chains keep going past failures. Don't gate commits/pushes behind piped commands; check exit codes separately.
- 2026-07-18: The codex plugin's rescue subagent is a fire-and-forget forwarder — it doesn't reliably carry a long spec or run in a specific worktree (jobs landed as 10s greeting sessions in the main repo). For real work packages, run `codex exec -C <worktree> --sandbox workspace-write - < spec.md` directly in background Bash.
- 2026-07-18: Playwright specs don't load .env (Next dev does its own loading) — spec-side DB clients silently fell back to port 5432, hitting the system EDB Postgres ("password authentication failed for user fastlane"). playwright.config.ts now imports "dotenv/config"; keep it that way.
- 2026-07-18: When two parallel branches must add the same line (e.g. `export const dynamic = "force-dynamic"`), make the change byte-identical in both (same position) or git merge keeps both copies and the build breaks with duplicate declarations.
- 2026-07-18: Review Remotion templates from rendered MP4 frames at multiple timestamps, not just fixed-percent stills — the slideshow/hook-demo caption clipping only showed in the 0.5–2s window that the 0%/20% stills straddled.
- 2026-07-19: Started scaffolding Stripe billing (Phase 7) that the user has repeatedly rejected — stale plan.md/memory kept listing it as "next". Billing is permanently CUT: never build or propose Stripe/checkout/paywalls here. Scope exclusions now live at the top of CLAUDE.md; check them before picking the next work package.
- 2026-07-21: Playwright spec files share one worker process AND the app's single default workspace: per-spec `pool.end()` in afterAll kills the DB for every spec that runs after it, and parallel workers let one spec's cleanup delete another's workspace mid-test. Config: workers:1; specs never call pool.end().
- 2026-07-21: `/api/videos` streaming is authenticated — curl gets 401; verify renders via the local store (.renders/store/...) or a signed-in browser session.
