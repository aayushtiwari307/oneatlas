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

## M2 - Data ingestion and seed (h4-8)  `[~]`
- [x] `data/curated/{labs,providers,benchmarks,models,scores}.json` + provenance note (15 labs, 10 providers, 8 benchmarks, 62 models, scores for 50 models)
- [x] `schemas.ts` strict Zod schemas and cross-file reference validation (M2a; owner reports 7 tests passed)
- [x] `slug.ts`, `normalize.ts`, and `recompute.ts` pure helpers + Vitest tests (M2b; owner reports typecheck passed and 30 tests passed)
- [x] `sources/openrouter.ts` (response envelope/model schema and mapping; endpoint response reviewed on 2026-11-21)
- [x] `run.ts` idempotent sequential upserts, reject log, and `IngestionRun` row
- [x] `prisma/seed.ts` and offline `npm run seed` wiring
- [x] Recompute `Model.minInputPrice/minOutputPrice` after each ingestion using the tested pure helper
**Done when:** 100+ models, every model has a lab, most have 1+ provider offering, benchmark scores exist for the curated subset. README note on real vs curated data started.

## M3 - Backend API (h8-14)  `[~]`
- [x] Model repository + service implemented in M3a; query builder, FTS/trigram search and DTO mapper covered by unit tests (owner reports M3a typecheck and 50 tests passed)
- [x] `/api/models` and `/api/models/[slug]` implemented in M3a (owner reports M3a typecheck and 50 tests passed)
- [x] `/api/models/compare` and `/api/rankings` repositories, services, validators and routes added in M3b; owner reports typecheck passed and 65 tests passed
- [x] Compare alignment handles missing scores, higher/lower-is-better benchmarks and ambiguous top ties; ranking helper uses competition ranks and deterministic slug tie-breaks
- [x] Benchmarks, labs and providers repositories/services/mappers/validators/routes added in M3c; owner reports typecheck passed and 74 tests passed
- [x] Global search and filters repositories/services/mappers/validators/routes added in M3d; owner reports typecheck passed and 88 tests passed across 15 files
- [ ] Curl verification for every endpoint remains pending until Neon migrations and seed are complete
**Done when:** every endpoint verified with curl, including `?limit=9999` (clamped or 400), bad slug (404), empty results.

## M4 - Frontend core / vertical slice (h14-20)  `[~]`  CHECKPOINT 1
- [x] M4a: app shell, QueryClientProvider, nuqs adapter, landing page, `/models` search/filter/sort/pagination/grid-table states; owner reports typecheck passed and 91 tests passed across 16 files
- [x] M4b: `/models/[slug]` overview, specs, active provider price table, benchmark cards/bars, similar models, metadata and route loading/error/not-found states; owner reports typecheck passed and 97 tests passed across 17 files
- [ ] Deployed to Vercel with production data
**Done when:** the demo flow (search, filter, sort, open a model) works on the live URL.

## M5 - Compare and rankings (h20-25)  `[x]`
- [x] M5a: persistent compare tray (max 4), localStorage selection, compare add/remove actions and `/compare?models=` page with best-per-row and benchmark highlighting (owner reports patch passed local checks; detailed command output not pasted)
- [x] M5b: `/rankings` category and benchmark tabs, API-backed leaderboard table, direction-aware score bars, lab links, input pricing and illustrative-data notice (owner confirms passed; detailed command output not pasted)

## M6 - Labs, providers, global search (h25-28)  `[x]`  CHECKPOINT 2
- [x] `/labs`, `/labs/[slug]` with model release timeline grouped newest-first by UTC release year; missing/invalid release dates grouped last
- [x] `/providers`, `/providers/[slug]` with supported models and this provider's active offering prices
- [x] Cmd/Ctrl+K palette using `/api/search`, grouped results, 250ms debounce and arrow/Enter/Escape keyboard controls
**Done when:** all six core requirements are functionally present. Sleep/buffer block follows.

## M7 - Differentiators and polish (h32-37)  `[~]`
Priority order (cut from the bottom):
1. [x] Price vs performance scatter chart backed by `/api/insights/price-performance`
2. [x] Cost calculator on the model detail page using the pure `estimateMonthlyCost` helper
3. [x] Related models retained; cheapest active input-price provider badge made explicit and tie-safe
- [~] Responsive pass: layout changes for narrow inputs, responsive chart/table containers and reduced-motion support added; owner must visually verify 375 / 768 / 1440
- [~] 404/error boundaries exist; labels, chart text alternative, focus rings and reduced-motion support reviewed; owner must complete keyboard/contrast review
**Done when:** owner typecheck/tests/lint/build pass and the insight chart, calculator and accessibility/responsive checks are manually verified.

## M8 - Tests, CI, deployment hardening (h37-42)  `[~]`
- [x] Vitest suites green (owner reports 146 tests passed in 27 files); added two Playwright smoke tests for search/filter/detail and compare flow (local browser run pending)
- [x] GitHub Actions workflow added for lint, typecheck, unit tests and production build with placeholder DB URLs; first CI run pending
- [x] Added dynamic `/api/health` route (`SELECT 1`, 503 on failure, no error leakage)
- [x] Owner ran `npm install`; root Playwright dependency/script added and local lockfile updated (commit status still to be confirmed)
- [x] Owner reports `npm run typecheck`, `npm run lint`, `npm test` (146 tests / 27 files) and `npm run build` all pass after the M8 root fix
- [ ] Chromium installation and `npm run test:e2e` remain pending; prior browser download was interrupted and Neon is deferred
- [ ] Confirm `.github/workflows/ci.yml` is green on GitHub after pushing the current lockfile and source
- [ ] Neon migration/seed, production seed, cache headers and API curl checks
- [ ] Lighthouse on `/models` and a detail page
- [ ] Manual phone/incognito/cold-start/invalid-params/compare-limit checks
- [ ] Verify no secrets are tracked in Git

## M9 - README, Loom, submit (h42-47)  `[~]`
- [x] README drafted with architecture diagram, setup, decision log, data honesty and known limitations (owner must review once Neon/deploy decisions are final)
- [x] 7–8 minute Loom recording script prepared in `docs/LOOM_SCRIPT.md`
- [ ] Record Loom with a seeded database/live demo; accurately disclose any remaining limitations
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
- 2026-11-21 GPT M9 documentation handoff. ADDED: root `README.md` with product feature list, architecture flowchart, technology stack, setup/migration/seed/test/deploy instructions, API map, data provenance, known limitations and current verification status; expanded `docs/DECISIONS.md`; added `docs/LOOM_SCRIPT.md` (7–8 minute outline); updated `docs/FINAL_TEST_PLAN.md` and this milestone tracker. OWNER-REPORTED LOCAL VERIFICATION: `npm run typecheck`, `npm run lint`, `npm test` (146 tests across 27 files) and `npm run build` passed after M8 root integration fix. DEFERRED BY OWNER: Neon setup/migrations/seed, curl/API smoke, Playwright E2E (Chromium download interrupted), Vercel deployment and production UI checks. SECURITY FOLLOW-UP: `npm audit` reports four high severity transitive findings involving `deepmerge-ts` and `effect` via Prisma tooling; npm's forced remediation proposes Prisma 7, so do not force-upgrade. M2 scope discrepancy remains: 62 curated models meet SPEC 60–80 but not the separate milestone 100+ wording. NEXT: review/merge docs, commit the current `package-lock.json` and project, then when ready complete Neon migration/seed -> API curl -> Playwright -> deploy/live checks -> record Loom -> submit form.
- 2026-11-21 GPT M8 handoff. PATCH ADDS: `@playwright/test` 1.65.1 and `npm run test:e2e`; two Chromium smoke tests using a migrated/seeded database (search + type filter + model detail + add-to-compare, and add two models + open the side-by-side comparison); `playwright.config.ts` starts local `npm run dev` unless `PLAYWRIGHT_BASE_URL` is set; GitHub Actions workflow runs `npm ci`, Prisma Client generation, lint, typecheck, Vitest and production build using placeholder database URLs without a running DB; dynamic `/api/health` executes tagged `SELECT 1`, returns `{ data: { status: "ok", db: true } }` on success and a non-leaking 503 `{ data: { status: "unavailable", db: false } }` on failure. NOT VERIFIED: owner must merge patch, run `npm install` to update and commit `package-lock.json`, run typecheck/tests/lint/build, install Chromium and run Playwright after Neon migration + seed, and inspect first GitHub Actions run. M7 remains in progress until lint/build and responsive/a11y walkthrough are completed. NEXT: run dependency install, typecheck, Vitest, lint, build; then seed Neon and run `npm run test:e2e`.
- 2026-11-21 GPT M7 handoff. PATCH ADDS: `GET /api/insights/price-performance?benchmark=` (selects a stable default benchmark when omitted; unknown explicit benchmark returns 404); Prisma repository selects models with a score and active offering, orders the cheapest active offering by input price, and mapper computes `(3*input + output)/4`; homepage SVG scatter chart backed by `/api/benchmarks` and the insight API, benchmark selector, loading/error/empty states and illustrative-data caveat; model detail monthly cost calculator with provider selector and editable monthly input/output tokens; pure `estimateMonthlyCost`, scatter coordinate layout and cheapest-provider tie helpers with unit tests; responsive mobile form sizing and reduced-motion CSS. NOT VERIFIED: owner must run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`; DB endpoint and interactive UI require Neon migration + seed; owner visual checks at 375/768/1440 and keyboard/contrast review pending. NEXT: apply patch, run typecheck/tests, resolve failures, then do manual/DB checks before M8.
- 2026-11-21 GPT M6 verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 120 tests across 22 files. This verifies local TypeScript and unit tests; directory/search data still requires Neon migration + seed for full browser verification.
- 2026-11-21 GPT M6a handoff. PATCH ADDS: dynamic `/labs` and `/providers` directory pages; dynamic `[slug]` detail pages with metadata and 404 handling; lab model release timeline grouped by UTC year (unknown dates last); provider model table with this provider's active offering input/output prices; Add-to-Compare actions in lab/provider model lists; responsive loading/error/empty states; global root 404; Cmd/Ctrl+K native-dialog palette using TanStack Query against `/api/search`, grouped model/lab/provider results, debounce, arrow-key wrapping, Enter navigation and Escape close; nav/footer links. Adds nine pure tests for release grouping and search result navigation. NOT VERIFIED: owner must run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`; pages and palette require Neon migrations + seed for real data. NEXT: apply patch, run typecheck/tests, fix failures; then M7 chart/cost differentiators and responsive/a11y polish.
- 2026-11-21 GPT M5b verification. OWNER CONFIRMS: M5b patch passed local checks; detailed terminal output not pasted, so exact test count is not independently recorded here.
- 2026-11-21 GPT M5a verification. OWNER REPORTS: M5a patch passed local verification. Detailed command output was not pasted, so exact test count is not independently recorded here. M5b is next.
- 2026-11-21 GPT M5b handoff. PATCH ADDS: dynamic `/rankings` page with category tabs, benchmark selector, nuqs URL state (`category` and `benchmark`), TanStack Query calls to `/api/benchmarks` and `/api/rankings`, direction-aware score bars, competition-rank display, model/lab links, cheapest input pricing, loading/error/empty states, responsive horizontal leaderboard table, header navigation entry and an explicit illustrative benchmark-data warning. Five pure score-bar tests added. NOT VERIFIED: owner must run `npm run typecheck` and `npm test`; real rankings require Neon migrations and seed. NEXT: apply patch, run checks, then continue M6 labs/providers/Cmd+K.
- 2026-11-21 GPT M5a handoff. PATCH ADDS: SSR-safe persisted compare-selection provider (localStorage reads/writes guarded by try/catch and storage-event sync), four-model cap, add/remove actions on explorer cards/table rows and model detail, persistent compare tray, shareable `/compare?models=` page calling the existing `/api/models/compare?slugs=` endpoint, side-by-side specs/pricing and benchmark score alignment, row-best highlighting with ties, error/loading/empty states, and unit tests for selection normalization and comparison winners. NOT VERIFIED: owner must run typecheck/tests; API-backed comparison requires Neon migration and seed. NEXT: apply patch and run `npm run typecheck`, `npm test`; then M5b implements rankings UI.
- 2026-11-21 GPT M4b verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 97 tests across 17 files. This verifies local TypeScript and unit tests; detail page data still requires Neon migrations + seed.
- 2026-11-21 GPT M4b handoff. PATCH ADDS: `/models/[slug]` dynamic server-rendered detail page using the existing model detail service; request-cached metadata/page read; strict slug validation and `notFound()`; model overview, lab/type/release metadata, context/output/pricing/provider specs, modalities/capabilities, active provider price table with lowest-input highlight, benchmark score cards with provenance and percentage-only bars, related models (same lab or shared capabilities, newest first, max 4), route loading/error/not-found states, and six pure benchmark-bar tests. NOT VERIFIED: owner must run `npm run typecheck` and `npm test`; detail rendering and similar-model query require Neon migration + seed. NEXT: apply patch and run typecheck/tests, then test a known model and unknown slug after database setup.
- 2026-11-21 GPT M4a verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 91 tests across 16 files. This verifies local typecheck and unit tests only; the model explorer needs Neon-backed APIs to load catalogue rows.
- 2026-11-21 GPT M4a handoff. PATCH ADDS: root app shell (metadata, sticky header, footer, dark tokens), QueryClientProvider, nuqs App Router adapter, landing page and `/models` explorer. Explorer uses TanStack Query against `/api/models` and `/api/filters`; URL state covers search, lab/provider/type/capability/modality/context/price filters, sort, page and grid/table view; search debounce is 300ms; mobile filters use native `<dialog>`; loading, empty, error and retry states included. Adds pure request-builder tests. NOT VERIFIED: owner must run typecheck/tests/lint/build; database/API-backed UI needs Neon migration + seed. NEXT: apply patch and run `npm run typecheck`, `npm test`; then M4b adds the model detail page.
- 2026-11-21 GPT M3d verification. OWNER REPORTS: M3d test files are present; `npm run typecheck` passed and `npm test` passed 88 tests across 15 files. This verifies local typecheck and unit tests only; API HTTP behavior and curl smoke remain pending Neon migration + seed.
- 2026-11-21 GPT M3d handoff. PATCH ADDS: `GET /api/search?q=&limit=` and `GET /api/filters`; grouped model/lab/provider search; relevance order restored after Prisma `IN`; strict Zod search validation (limit 1–10, default 5; absent or shorter-than-2-character query returns empty groups); global capability/type/input-modality counts; lab/model and active-provider counts; context-window and input-price ranges; unit tests for validators, search ordering and filter aggregation. Counts are global, not faceted, per spec. NOT VERIFIED at patch handoff: local typecheck/tests and DB-backed API behavior. NEXT: owner applies and locally verifies, then run M3 API smoke after database setup.
- 2026-11-21 GPT M3c verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 74 tests across 12 files. This verifies local typecheck and unit tests only; API HTTP behavior remains unverified until Neon migrations + seed are available.
- 2026-11-21 GPT M3c handoff. PATCH ADDS: `GET /api/benchmarks[?category=]`, `GET /api/labs`, `GET /api/labs/[slug]`, `GET /api/providers`, and `GET /api/providers/[slug]`; repository/service/mapper layers; DTOs; Zod validation for categories, empty query strings and slug path params; mapper and validator unit tests. Lab detail models sort by release date descending with nulls last. Provider detail includes only active offerings and converts provider-specific Decimal prices to numbers at the mapper boundary. NOT VERIFIED: owner has not yet run this patch; TypeScript and Vitest must be run locally. Neon-backed endpoint behavior remains unverified until migrations + seed are complete. NEXT: apply M3c and run `npm run typecheck` then `npm test`; then M3d adds global search and filter APIs.
- 2026-11-21 GPT M3b verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 65 tests across 10 files. Compare and rankings have local typecheck/unit-test coverage. PostgreSQL-backed HTTP behavior remains unverified until Neon migrations + seed are complete.
- 2026-11-21 GPT M3a verification. OWNER REPORTS: `npm run typecheck` completed with no errors and `npm test` passed 50 tests across 7 files. M3a model API routes are locally typechecked/unit-tested; PostgreSQL-backed endpoint behavior remains unverified until Neon is configured and seeded.
- 2026-11-21 GPT M2b verification. OWNER REPORTS: `npm run typecheck` passed and `npm test` passed 30 tests across 4 files (slug 6, recompute 6, normalize 11, schemas 7). The Vite native-config warning is non-fatal. M2b is locally verified.
- 2026-11-21 GPT M2c/M2d verification. OWNER REPORTS: `npm test` passed 38 tests across 5 files (including OpenRouter tests) and `npm run typecheck` (`tsc --noEmit`) completed with no errors. This verifies offline/unit code only; no Neon DB was available, so `npm run seed` and `npm run sync:openrouter` remain unexecuted. Curated model count is 62, which meets `docs/SPEC.md` 60–80 target but not the separate M2 milestone 100+ wording; keep this acceptance discrepancy visible pending owner decision.
- 2026-11-21 GPT M2a handoff. DONE in this batch: offline curated JSON fixtures for 15 labs, 10 providers, 8 benchmarks, 62 models and 80 score rows covering 50 models; provenance note; strict Zod dataset schemas with cross-file reference and duplicate checks; schema tests; Vitest node config. Numeric model metadata, all offering prices/provider associations, release dates and all score values are illustrative; score rows explicitly use `source: "illustrative"`. NOT DONE: no database, migrations, seed runner, normalizers, OpenRouter sync, or project commands run in this environment. UNVERIFIED: Vitest/Zod type compatibility and local `npm run typecheck && npm test` (run in the Windows project and paste any failures). Scope note: `docs/SPEC.md` targets 60-80 models, while this milestone's Done definition says 100+; current M2a follows the SPEC range (62), so resolve the discrepancy before marking M2 complete. NEXT: M2b slug/field normalizers, exact price conversion and recompute helpers with unit tests; then build the idempotent offline seed runner.
- 2026-11-21 Claude -> GPT. DONE locally: Next.js project created, deps installed (prisma/@prisma/client 6.19.x, zod 4.6.x, @types/node 22, tsx, vitest), kit files copied, first commit e1ab9d6. NOT DONE: Neon, migrations, Vercel, UI primitives, everything from M2 onward. UNVERIFIED (check the context snapshot first): `npx prisma validate` (trigram index syntax `ops: raw("gin_trgm_ops")`), `npm run typecheck`, and that package.json has scripts postinstall/typecheck/test/seed and `prisma.seed`. CHANGE: `sort` and `order` in `src/lib/validators/models.ts` are now optional (service resolves defaults, see docs/SPEC.md section 4). NEXT: M2a curated data files + Zod schemas, then M2b normalizers/seed/tests. DB work is intentionally deferred to the end; see docs/FINAL_TEST_PLAN.md.
- (empty) M0 kit created by Claude. Nothing has been run or tested yet.
