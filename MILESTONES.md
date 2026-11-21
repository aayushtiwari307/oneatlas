# OneAtlas Milestones

Source of truth for progress. **Update the status line and "Handoff notes" at the end of every milestone, then commit.**
Total budget: 48h. Checkpoint 1 (vertical slice live) = hour 20. Checkpoint 2 (all 6 requirements present) = hour 26.

Legend: `[ ]` todo, `[~]` in progress, `[x]` done

---

## M0 - Setup and empty deploy (h0-2)  `[ ]`
- [ ] 45 min research: OpenRouter, RouterPlus, LiteLLM, oneatlas.dev. Write 8-10 bullets in `docs/research.md` (what to borrow, what to improve).
- [ ] `npx create-next-app@latest oneatlas --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [ ] Install deps (see Commands below). `npx shadcn@latest init`
- [ ] Copy the kit files over the project (prisma/, src/lib/, .env.example, AGENTS.md, MILESTONES.md)
- [ ] Create Neon project. Fill `.env` (pooled `DATABASE_URL`, direct `DIRECT_URL`)
- [ ] Add `"postinstall": "prisma generate"` to package.json scripts
- [ ] Push to GitHub, import into Vercel, set env vars, deploy
**Done when:** live URL loads and a trivial API route (`/api/health`) can run `SELECT 1` on Vercel.

## M1 - Schema and DB foundation (h2-4)  `[ ]`
- [ ] `npx prisma migrate dev --name init --create-only`
- [ ] Edit the generated `migration.sql`: PREPEND PART 1 and APPEND PART 2 from `prisma/sql/search_setup.sql`
- [ ] `npx prisma migrate dev` then `npx prisma generate`
- [ ] Apply to production: `npx prisma migrate deploy` (with prod `DIRECT_URL`)
- [ ] Add `/api/health` using `lib/api` helpers
**Done when:** tables, GIN indexes, trigram index and the search trigger all exist in Neon (check with `\d "Model"`).

## M2 - Data ingestion and seed (h4-8)  `[ ]`
- [ ] `data/curated/{labs,providers,benchmarks,scores}.json` (15+ labs, 10+ providers, 6-8 benchmarks, scores for 25+ models)
- [ ] `server/ingestion/`: `sources/openrouter.ts` (verify endpoint + shape first), `normalize.ts` (slugs, price per 1M, modalities, capabilities), `schemas.ts` (Zod), `run.ts` (transaction upsert, reject log, `IngestionRun` row)
- [ ] `prisma/seed.ts` and `npm run seed`
- [ ] Recompute `Model.minInputPrice/minOutputPrice` after each ingestion
- [ ] Vitest unit tests for normalizers
**Done when:** 100+ models, every model has a lab, most have 1+ provider offering, benchmark scores exist for the curated subset. README note on real vs curated data started.

## M3 - Backend API (h8-14)  `[ ]`
- [ ] Repositories + services for models, labs, providers, benchmarks, rankings, search, filters
- [ ] Routes: `/api/models`, `/api/models/[slug]`, `/api/models/compare`, `/api/search`, `/api/rankings`, `/api/benchmarks`, `/api/labs(/[slug])`, `/api/providers(/[slug])`, `/api/filters`
- [ ] FTS + trigram query for `q`, relevance sort when `q` present
- [ ] DTO mappers (Decimal -> number), envelope on every response, cache headers
- [ ] Vitest for query builder and compare service
**Done when:** every endpoint verified with curl, including `?limit=9999` (clamped or 400), bad slug (404), empty results.

## M4 - Frontend core / vertical slice (h14-20)  `[ ]`  CHECKPOINT 1
- [ ] App shell: header, nav, footer, theme tokens, QueryClientProvider, nuqs adapter
- [ ] `/models`: search, filter panel (mobile drawer), sort, pagination, grid/table toggle, skeletons, empty/error states
- [ ] `/models/[slug]`: overview, specs, provider price table, benchmarks
- [ ] Deployed to Vercel with production data
**Done when:** the demo flow (search, filter, sort, open a model) works on the live URL.

## M5 - Compare and rankings (h20-25)  `[ ]`
- [ ] Compare tray (persistent bar, max 4) + `/compare?models=` with best-per-row highlighting
- [ ] `/rankings`: category and benchmark tabs, leaderboard table, score bars

## M6 - Labs, providers, global search (h25-28)  `[ ]`  CHECKPOINT 2
- [ ] `/labs`, `/labs/[slug]` (models + release timeline sorted by releaseDate)
- [ ] `/providers`, `/providers/[slug]` (supported models with this provider's prices)
- [ ] Cmd+K palette using `/api/search` (grouped results)
**Done when:** all six core requirements are functionally present. Sleep/buffer block follows.

## M7 - Differentiators and polish (h32-37)  `[ ]`
Priority order (cut from the bottom):
1. Price vs performance scatter chart
2. Cost calculator on the detail page
3. Similar models / cheapest provider badge
- [ ] Responsive pass at 375 / 768 / 1440
- [ ] 404 and error pages, a11y pass (focus, labels, contrast)

## M8 - Tests, CI, deployment hardening (h37-42)  `[ ]`
- [ ] Vitest suites green; 1-2 Playwright smoke tests (search, filter, open model, add to compare)
- [ ] GitHub Actions: lint, typecheck, test
- [ ] Production seed verified, cache headers verified, Lighthouse on `/models` and a detail page
- [ ] Manual: phone, incognito, cold start, invalid params, 5+ models in compare
- [ ] No secrets in repo

## M9 - README, Loom, submit (h42-47)  `[ ]`
- [ ] README: architecture diagram, setup, decision log, data honesty, known limitations
- [ ] Loom 7-8 min (outline in AGENTS.md)
- [ ] Submit Google Form with 1h+ buffer

---

## Commands

```bash
# M0 deps
npm i @prisma/client@6 zod @tanstack/react-query nuqs lucide-react
npm i -D prisma@6 tsx vitest @playwright/test
# prisma seed config: add to package.json  "prisma": { "seed": "tsx prisma/seed.ts" }
```

## Handoff notes (append newest at top)
- 2026-11-21 Claude -> GPT. DONE locally: Next.js project created, deps installed (prisma/@prisma/client 6.19.x, zod 4.6.x, @types/node 22, tsx, vitest), kit files copied, first commit e1ab9d6. NOT DONE: Neon, migrations, Vercel, UI primitives, everything from M2 onward. UNVERIFIED (check the context snapshot first): `npx prisma validate` (trigram index syntax `ops: raw("gin_trgm_ops")`), `npm run typecheck`, and that package.json has scripts postinstall/typecheck/test/seed and `prisma.seed`. CHANGE: `sort` and `order` in `src/lib/validators/models.ts` are now optional (service resolves defaults, see docs/SPEC.md section 4). NEXT: M2a curated data files + Zod schemas, then M2b normalizers/seed/tests. DB work is intentionally deferred to the end; see docs/FINAL_TEST_PLAN.md.
- (empty) M0 kit created by Claude. Nothing has been run or tested yet.
