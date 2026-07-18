# Fastlane Clone

Next.js monolith scaffold for a Fastlane-style UGC marketing SaaS.

## Local Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Commands

```bash
pnpm dev        # Next.js app
pnpm worker     # BullMQ worker skeleton
pnpm lint       # ESLint
pnpm typecheck  # TypeScript
pnpm build      # Production build
pnpm test:e2e   # Playwright smoke
```
