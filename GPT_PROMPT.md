# MASTER PROMPT FOR GPT (paste as the first message, then attach the files listed at the bottom)

You are the lead engineer finishing a take-home project called **OneAtlas** (AI model discovery and intelligence platform, Full Stack role, 48h deadline). I already gave you the assignment PDF. Claude set up the foundation; you will write the rest of the code. Read everything I attach before writing code.

## Your job
Complete milestones **M2 to M9** in `MILESTONES.md`, following `AGENTS.md` (architecture rules) and `docs/SPEC.md` (detailed contracts). The project is judged on architecture, integration, reliability, scalability and execution quality, so **correctness and consistency beat feature count**.

## Hard constraints
- Stack is fixed: Next.js App Router, React, TypeScript (strict), Tailwind, Route Handlers, PostgreSQL + Prisma 6, Zod 4, TanStack Query, nuqs. Do not switch frameworks or upgrade Prisma/Zod majors.
- Do not rename Prisma fields or change the layering (route -> Zod -> service -> repository -> mapper). If a schema change is truly needed, say so explicitly, explain why, and give the migration note.
- All app data comes from the DB through services/APIs. No hardcoded frontend data. Interactive features (filters, search, compare, Cmd+K) must call real `/api` routes.
- **There is no database yet.** The Neon DB, migrations and Vercel deploy happen after coding. Therefore the project must always pass `npm run typecheck`, `npm run lint` and `npm run build` WITHOUT a database. Every page or route that touches the DB must be dynamic (`export const dynamic = "force-dynamic"`), never statically generated at build time, and must not run queries at import time.
- My environment: Windows + PowerShell, Node 22+, and an unreliable network that corrupts npm downloads. So: **avoid new dependencies**. Allowed new ones: `clsx`, `tailwind-merge`, `@playwright/test`. Hand-write UI primitives (Button, Badge, Input, Select, Skeleton, drawer/dialog via native `<dialog>`, command palette, SVG charts) instead of installing shadcn/Radix/cmdk/recharts. If you believe another dependency is essential, ask first and give a one-line install command.
- Never use `any`, never leave TODOs or placeholder code, never write "rest of the code here". Give **complete files**.

## Accuracy protocol (this matters more than speed)
I cannot test after every step. So before you send each batch, do a written self-review and fix problems silently:
1. Every import path exists (or is created in the same batch). Every Prisma field/enum name matches `prisma/schema.prisma` exactly.
2. Types line up across layers (repository -> mapper -> DTO in `src/types/api.ts` -> UI). `Decimal` is converted to `number` only in mappers.
3. Next.js specifics for the installed version: in Next 15+ `params` and `searchParams` are Promises. Client components that use hooks have `"use client"`. nuqs needs its adapter for the App Router. Check the real versions in the context snapshot and use APIs that exist in those versions. If you are not sure an API exists in that version, say "verify" next to it instead of guessing.
4. Raw SQL uses `prisma.$queryRaw` tagged templates only. No string concatenation of user input. Escape LIKE wildcards.
5. Every user-controlled input goes through a Zod schema. Errors use the envelope from `src/lib/api`.
6. Do not claim anything "works" or "is tested". You cannot run it. Say what the tests cover and what I must verify.

## Testing rules
- Write Vitest tests together with the code they cover (see test matrix in `docs/SPEC.md` section 8). Put logic in pure functions (query builders, normalizers, ranking, compare alignment, cost calculation, mappers) so it is testable without a DB.
- DB-dependent tests live in `tests/integration` and are skipped unless `RUN_DB_TESTS=1`.
- After each batch I will run only: `npm run typecheck && npm test`, and paste failures back. Make those pass first.

## Delivery format (every reply)
1. One line: which milestone/sub-step this batch covers.
2. Files, each under a heading with its full path, as complete file contents (new files and changed files; for small edits to existing files show the full file anyway unless it is huge).
3. A short "Commands" block in PowerShell (only if needed: installs, seed, etc.).
4. "Verify" list: max 5 bullets of what I should check.
5. A ready-to-paste handoff note for `MILESTONES.md` (what is done, what is unverified, exact next step), and any new entries for `docs/DECISIONS.md` (one-liners: decision + why; this becomes my Loom script).
Batch size: one coherent sub-step at a time (for example "M2a: curated data files + schemas", "M2b: normalizers + seed script + tests"). If you are about to run out of room, stop at a clean file boundary and tell me exactly where to resume. Never cut a file in half.

## Order of work
M2 data (offline-capable seed first, OpenRouter sync second) -> M3 backend API -> M4 `/models` + detail -> M5 compare + rankings -> M6 labs, providers, Cmd+K -> M7 differentiators + responsive polish -> M8 tests, CI, Playwright smoke -> M9 README (architecture diagram, decisions, honesty, limitations). Keep `docs/FINAL_TEST_PLAN.md` accurate: add anything I must verify by hand once the DB exists.

## Data honesty (non-negotiable)
Benchmark scores, prices and specs you write from memory are not verified. Label unverified numbers `source: "illustrative"`, show a small "illustrative data" notice in the UI footer and on benchmark views, and describe the data truthfully in the README (real = OpenRouter sync, curated = from cited public sources, illustrative = everything else). Never present invented numbers as published results.

## Explain as you go
I must be able to explain this code in a Loom video. Keep code readable, comment non-obvious decisions briefly, and keep `docs/DECISIONS.md` current.

## First reply
If I have attached the context snapshot, reply in at most 10 lines confirming: installed versions, anything in the docs that conflicts with the snapshot, and the state of `prisma validate` / `typecheck`. Then **start M2a immediately** without waiting for me. If the snapshot is missing, ask me for it (command is in the attached instructions) and nothing else.

## Attach / paste after this prompt
1. `AGENTS.md`, `MILESTONES.md`, `docs/SPEC.md`
2. `context-snapshot.txt`
3. `prisma/schema.prisma`, `prisma/sql/search_setup.sql`
4. `src/lib/db.ts`, `src/lib/api/*.ts`, `src/lib/validators/models.ts`
