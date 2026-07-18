# Lessons (append-only)

Mistakes and their fixes. Read at the start of every session. Append, never rewrite.

- 2026-07-18: Project started. No lessons yet.
- 2026-07-18: Port 5432 on this machine is owned by a system EDB PostgreSQL 18 (`/Library/PostgreSQL/18`, password auth). Local dev uses brew postgresql@17 on **port 5433** (trust auth, role/db `fastlane`). `.env` reflects 5433; docker-compose still maps 5432 for machines without the conflict.
- 2026-07-18: pnpm 11 ignores `pnpm.onlyBuiltDependencies` in package.json — native build approvals live in `pnpm-workspace.yaml` under `allowBuilds`.
- 2026-07-18: Codex sandbox has no network — it cannot run `pnpm install` or anything package-backed. Have Codex write code + configs; run installs/builds/tests outside afterward.
- 2026-07-18: A wedged `next dev` (listening but unresponsive) on port 3000 makes Playwright's webServer wait time out. Kill stray listeners on 3000/3001 before `pnpm test:e2e`.
