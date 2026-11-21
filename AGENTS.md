# AGENTS.md - context for any AI assistant (Claude, GPT, Cursor...)

Read this fully, then read MILESTONES.md and continue from the first unchecked item.

## Project
OneAtlas: AI model discovery and intelligence platform (take-home, Full Stack role, 48h). Evaluated on architecture, integration, reliability, scalability, execution quality. The owner must be able to explain every decision in a Loom video, so prefer simple, readable code over clever code, and explain non-obvious choices in short comments.

## Mandatory stack
Next.js (App Router) + React + TypeScript + Tailwind. Node/TS backend via Next.js Route Handlers. PostgreSQL (Neon) + Prisma 6. Deploy on Vercel. Extras allowed: Zod, TanStack Query, nuqs, shadcn/ui, Vitest, Playwright.
Forbidden: prompt-to-app generators (Lovable, Bolt, Base44, etc.). All app data must come from the DB via APIs, never hardcoded in the frontend.

## Architecture rules
- Layers: Route Handler -> Zod validation -> service -> repository (Prisma). Routes stay thin.
- Server Components may call services directly. Interactive features (filters, search, compare, Cmd+K) must call the real `/api` routes via TanStack Query. Explain this split in the README.
- Never return raw Prisma rows. Map to DTOs; convert `Decimal` to `number` at the mapper boundary.
- Envelope: success `{ data, meta? }`, failure `{ error: { code, message, details? } }`. Use `lib/api` helpers (`ok`, `route`, `AppError`).
- Every query string is parsed with a Zod schema (defaults, clamped `limit` max 100).
- URL is the source of truth for filters, sort, page and compare selection (nuqs).
- Pricing lives on `ModelProvider` (per-1M-token Decimal). `Model.minInputPrice/minOutputPrice` are denormalized from the cheapest active provider, refreshed by ingestion, so price sort/filter is a plain indexed query.
- Search: Postgres `tsvector` (trigger-maintained, GIN) + `pg_trgm` for typo tolerance. Raw SQL via `prisma.$queryRaw` with tagged templates only (no string concatenation).
- No `any`. No secrets in the repo. Commit after each working step with a clear message.

## Folder layout
```
prisma/schema.prisma  prisma/sql/search_setup.sql  prisma/seed.ts
data/curated/*.json
src/app/(site)/...        pages
src/app/api/...           route handlers
src/lib/{db.ts, api/, validators/}
src/server/{repositories, services, ingestion}
src/components/{ui, models, ...}   src/features/*
```

## Data honesty
README must state which data is real (OpenRouter sync), curated (benchmarks/labs/providers from published numbers) or illustrative.

## Loom outline (7-8 min)
30s what/who; 2m live demo; 2.5m architecture (layers, price on ModelProvider, Postgres FTS, server-component vs /api split); 1.5m ingestion and data honesty; 1m challenges and next steps.

## Handoff protocol
1. Work one milestone at a time. 2. Tick checkboxes in MILESTONES.md as you go. 3. Add a dated handoff note: what is done, what is broken, exact next step. 4. If you cannot run something, say so and give the command for the owner to run. Never claim it works untested.

## Paste-ready prompt for a fresh assistant
"You are continuing a Next.js/Prisma/Postgres project called OneAtlas. Read AGENTS.md and MILESTONES.md in the repo, check the latest handoff note, and continue from the first unchecked task. Follow the architecture rules exactly. Ask me for command output instead of guessing."
