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
