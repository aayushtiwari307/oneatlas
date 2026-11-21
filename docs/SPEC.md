# OneAtlas - Detailed Spec

Companion to AGENTS.md (rules) and MILESTONES.md (progress). If this file and the code disagree, fix the code or update this file in the same batch.

## 1. Environment facts
- Windows + PowerShell. Node 22+. `@types/node@22`. Prisma and @prisma/client pinned to 6.x. Zod 4.x. Next.js App Router (check exact version in package.json). Tailwind version per package.json (do not assume a `tailwind.config.js`; newer create-next-app uses Tailwind v4 CSS config).
- No Neon DB and no Vercel project yet. Project already committed once on branch `master`.
- Network is unreliable: minimize new dependencies.
- Allowed new deps: `clsx`, `tailwind-merge`, `@playwright/test`. Everything else is hand-written.

## 2. Quality bar
Strict TS, no `any`, no dead code, no placeholders. Small pure functions for logic. Every route has: Zod parsing, envelope, correct status codes (400 validation, 404 missing, 500 generic), cache headers on read endpoints. Every page has loading, empty and error states and works at 375px, 768px and 1440px.

## 3. Folder layout (target)
```
data/curated/{labs,providers,benchmarks,models,scores}.json
prisma/seed.ts
src/types/api.ts                       DTO types shared by server and client
src/lib/query/models-query.ts          pure: resolveSort, buildModelsWhere, escapeLike
src/lib/{db.ts, api/, validators/}     (exists) + validators for labs/providers/rankings/search
src/server/ingestion/{slug,schemas,normalize,openrouter,seed,recompute}.ts
src/server/repositories/{models,labs,providers,benchmarks,search}.repo.ts
src/server/mappers/{model,lab,provider,benchmark}.mapper.ts
src/server/services/{models,compare,rankings,search,filters,labs,providers}.service.ts
src/app/api/...                        route handlers (thin)
src/app/(site)/...                     pages
src/components/{ui,models,compare,rankings,layout}/
src/features/{explorer,compare,palette}/   hooks + client logic
tests/integration/                     gated by RUN_DB_TESTS=1
docs/{SPEC,DECISIONS,FINAL_TEST_PLAN}.md
```

## 4. API contracts
All success responses: `{ data, meta? }`. Errors: `{ error: { code, message, details? } }`. Every route file exports `export const dynamic = "force-dynamic"` and wraps its handler in `route(...)`. Read endpoints return `ok(..., { cache: { sMaxAge: 60, staleWhileRevalidate: 300 } })`. Next 15+: `ctx.params` is a `Promise`.

### DTOs (`src/types/api.ts`)
```ts
type LabRef = { slug: string; name: string; logoUrl: string | null }
type ModelSummaryDTO = {
  id: string; slug: string; name: string; lab: LabRef
  type: ModelType; releaseDate: string | null            // ISO string
  contextWindow: number | null; maxOutput: number | null
  inputModalities: Modality[]; outputModalities: Modality[]; capabilities: Capability[]
  openWeights: boolean
  minInputPrice: number | null; minOutputPrice: number | null   // USD per 1M tokens, cheapest provider
  providerCount: number
}
type OfferingDTO = {
  provider: { slug: string; name: string }
  inputPricePer1M: number; outputPricePer1M: number; cachedInputPricePer1M: number | null
  contextWindow: number | null; maxOutput: number | null
  latencyMs: number | null; throughputTps: number | null; quantization: string | null
}
type BenchmarkRef = { slug: string; name: string; category: BenchmarkCategory; unit: string; higherIsBetter: boolean }
type ScoreDTO = { benchmark: BenchmarkRef; score: number; source: string | null; measuredAt: string | null }
type ModelDetailDTO = ModelSummaryDTO & { description: string | null; offerings: OfferingDTO[]; scores: ScoreDTO[] }
type PageMeta = { page: number; limit: number; total: number; totalPages: number }
```

### Endpoints
| Endpoint | Behavior |
|---|---|
| `GET /api/models` | Query per `modelsQuerySchema`. Returns `ModelSummaryDTO[]` + `PageMeta`. |
| `GET /api/models/[slug]` | `ModelDetailDTO`; offerings sorted by input price asc (active only); scores sorted by benchmark category then name. 404 if missing. |
| `GET /api/models/compare?slugs=a,b,c` | 2-4 slugs (schema in validators). Unknown slugs -> 404 listing the missing ones. Returns `{ models: ModelSummaryDTO[] (in requested order), benchmarks: { benchmark: BenchmarkRef; scores: Record<slug, number\|null>; bestModelSlug: string\|null }[] }`. Only benchmarks that at least one selected model has. `bestModelSlug` respects `higherIsBetter`; null if fewer than 2 models have a score or on exact tie of all. Route file must be `app/api/models/compare/route.ts` (static segment wins over `[slug]`). |
| `GET /api/search?q=&limit=` | `q` min 2 chars (else empty groups). `limit` per group default 5, max 10. Returns `{ models: ModelSummaryDTO[], labs: {slug,name,logoUrl,modelCount}[], providers: {slug,name,modelCount}[] }`. |
| `GET /api/rankings?benchmark=&category=&limit=` | `benchmark` slug; if absent, use the first benchmark in `category` (or first overall). Returns `{ benchmark: BenchmarkRef, entries: { rank: number; score: number; model: ModelSummaryDTO }[] }`. Order by score respecting `higherIsBetter`. Competition ranking (1,2,2,4) for ties. `limit` default 25, max 100. |
| `GET /api/benchmarks?category=` | List `BenchmarkRef & { modelCount }`. |
| `GET /api/labs`, `GET /api/labs/[slug]` | List with `modelCount`; detail has lab fields + `models` (ModelSummaryDTO[] sorted by releaseDate desc, nulls last) for the release timeline. |
| `GET /api/providers`, `GET /api/providers/[slug]` | List with `modelCount`; detail has provider fields + `models: (ModelSummaryDTO & { offering: OfferingDTO })[]` showing THIS provider's price. |
| `GET /api/filters` | `{ labs: {slug,name,count}[], providers: {slug,name,count}[], capabilities: {value,count}[], types: {value,count}[], modalities: {value,count}[], contextRange: {min,max}, priceRange: {min,max} }`. Counts are global (not faceted) for the MVP; list as a known limitation. |
| `GET /api/insights/price-performance?benchmark=` | (M7) points `{ slug, name, lab, score, blendedPrice }` where `blendedPrice = (3*input + output)/4` of cheapest offering. |
| `GET /api/health` | `{ status: "ok", db: true }` after `SELECT 1`; 503 with `db: false` on failure. Never leaks error text. |

### `/api/models` query semantics
- `sort` omitted -> `relevance` if `q` present, else `release`. `sort=relevance` without `q` -> treat as `release`.
- `order` omitted -> name: asc, price: asc, context: desc, release: desc, relevance: desc.
- Filters AND together. Inside one filter: `lab` any-of, `provider` any-of (active offerings only), `capability` has-all (`hasEvery`), `modality` input modalities has-all (`hasEvery`), `type` equals.
- `maxPrice`: `minInputPrice <= maxPrice` (null prices excluded). `minContext`: `contextWindow >= minContext`.
- Sorting: nulls always last (`{ sort, nulls: "last" }`); always add a unique tiebreaker (`slug asc`) so pagination is stable.
- Pagination: offset = (page-1)*limit; `prisma.$transaction([findMany, count])` with the SAME `where`; `totalPages = max(1, ceil(total/limit))`; page beyond range returns empty `data` with correct meta (not an error).
- Search (`q`): step 1 raw SQL returns up to 500 `{ id, rank }` rows matching ANY of: `searchVector @@ websearch_to_tsquery('simple', q)`, `name % q` (trigram, pg_trgm), `name ILIKE '%' || escaped || '%'`, or matching lab name via join. `rank = ts_rank_cd(vector, query) + similarity(name, q)`. Step 2: Prisma `findMany` with `id: { in: ids }` AND all other filters. For `relevance` sort, reorder results in memory by the rank map before slicing the page (ids list is capped at 500, so this is cheap). `websearch_to_tsquery` never throws on odd input; still escape `%`, `_`, `\` for ILIKE. If `q` yields zero ids -> return empty page immediately.
- Pure helpers (unit-tested) in `src/lib/query/models-query.ts`: `resolveSort(query)`, `buildModelsWhere(query, idsFromSearch?)`, `escapeLike(s)`.

## 5. Ingestion and data
**Principle:** `npm run seed` must work fully offline from `data/curated/*.json`. The OpenRouter sync (`npm run sync:openrouter`) is optional enrichment and must never be required for the app to function.

Curated JSON shapes (validate ALL with Zod at seed time; fail loudly on unknown references; print a summary of inserted/updated/rejected counts):
```
labs.json        [{ slug, name, country, website, description }]
providers.json   [{ slug, name, website, region, description }]
benchmarks.json  [{ slug, name, category, description, unit, higherIsBetter, sourceUrl }]
models.json      [{ slug, name, labSlug, type, releaseDate "YYYY-MM-DD", contextWindow, maxOutput,
                    inputModalities[], outputModalities[], capabilities[], openWeights, description,
                    offerings: [{ providerSlug, inputPricePer1M, outputPricePer1M, cachedInputPricePer1M?,
                                  contextWindow?, maxOutput?, latencyMs?, throughputTps?, quantization? }] }]
scores.json      [{ modelSlug, benchmarkSlug, score, source, measuredAt? }]
```
Targets: 15+ labs, 10+ providers, 6-8 benchmarks (mix of categories: knowledge, reasoning, coding, math, multimodal, agentic), 60-80 models, most with 1-4 offerings, scores for 25+ models. `source` is a citation/URL, or `"illustrative"` when unverified.

Seed rules: order labs -> providers -> benchmarks -> models -> offerings -> scores -> recompute min prices. Idempotent upserts by slug / composite unique keys. Do NOT wrap everything in one giant interactive transaction (default timeout is 5s); use batches (`$transaction([...])` of <= 50 ops) or sequential upserts. Log an `IngestionRun` row.

Recompute (`recompute.ts`): for each model, `minInputPrice`/`minOutputPrice` = values from the active offering with the lowest input price (null if none). Unit-test the pure part.

OpenRouter sync (optional, verify the response shape before trusting this): GET `https://openrouter.ai/api/v1/models`. Zod schema with `.passthrough()`. Prices are strings per token -> per 1M via `Prisma.Decimal(str).mul(1_000_000)` (no float math). Reject negative/dynamic-price entries (e.g. "-1"). Lab = id prefix before `/`. Offering provider = a single `openrouter` provider (honest: aggregate pricing). Map `architecture.input_modalities/output_modalities` to `Modality`; map `supported_parameters` (`tools`, `reasoning`/`include_reasoning`, `response_format`, `structured_outputs`) to `Capability`; add `VISION` when image is an input modality. `created` is unix seconds -> `releaseDate`. Rejects are logged, not fatal. Sync must not delete curated rows.

Slugs: lowercase, non-alphanumerics -> `-`, collapse repeats, trim `-`. Collisions get the lab slug appended. Pure function, unit-tested.

## 6. Pages and UI behavior
All DB pages are `force-dynamic`. Server Components may call services directly for first paint; interactive pieces use TanStack Query against `/api`. URL is the source of truth (nuqs) for filters, sort, page, view mode and compare selection.

- `/` hero + global search, newest models, top of 2-3 leaderboards, stats (counts from API).
- `/models` search box (debounced 300ms), filter panel (desktop sidebar, mobile drawer via native `<dialog>`), sort select, grid/table toggle, pagination, active-filter chips + clear all, skeleton rows, empty state with reset, error state with retry, "Add to compare" on each card/row.
- `/models/[slug]` header (lab, type, release), spec grid, modalities/capabilities badges, offerings table (cheapest highlighted), benchmark scores with bars, similar models (same lab or shared capabilities, max 4), `generateMetadata`. `notFound()` for unknown slug.
- `/compare?models=a,b,c` up to 4; side-by-side table; best value highlighted per row (lowest price, highest context, best benchmark via `bestModelSlug`); remove buttons; shareable URL; clear message if <2 models.
- Compare tray: persistent bottom bar on all pages when >=1 selected; selection stored in localStorage via a small hook (wrapped in try/catch, SSR-safe), "Compare" link builds the URL.
- `/rankings` category tabs + benchmark select, leaderboard table with rank, score bar relative to the top score, lab link, price. Respects `higherIsBetter`.
- `/labs`, `/labs/[slug]` (release timeline grouped by year), `/providers`, `/providers/[slug]` (table of supported models with this provider's prices).
- Cmd/Ctrl+K palette: native `<dialog>` or fixed overlay, keyboard navigation (up/down/enter/esc), grouped results from `/api/search`, debounced.
- Layout: sticky header with nav + search trigger, footer with "illustrative data" notice, `not-found.tsx`, `error.tsx`, `loading.tsx` per major route.
- Differentiators (M7, in this order): price-vs-performance SVG scatter, cost calculator (pure `estimateMonthlyCost` function), cheapest-provider badge.
- A11y basics: labels on inputs, focus rings, buttons are buttons, `aria-live` on result counts, color contrast, keyboard operable palette and drawer.

## 7. Config tasks (do early in M2/M3)
- `vitest.config.ts`: node environment, alias `@` -> `src`, include `src/**/*.test.ts` and `tests/**/*.test.ts`, exclude `tests/integration` unless `RUN_DB_TESTS=1`.
- package.json scripts: `postinstall: prisma generate`, `typecheck`, `test`, `seed`, `sync:openrouter`, plus `prisma.seed`.
- `.github/workflows/ci.yml`: install, `prisma generate`, lint, typecheck, test, build (build must pass without DB).
- `.env.example` already exists. Never commit `.env`.

## 8. Test matrix (Vitest unless noted)
| Unit | What to assert |
|---|---|
| `modelsQuerySchema` | defaults, clamps (`limit` 9999 -> error), csv parsing, empty strings, bad enum -> error, `sort`/`order` undefined by default |
| `compareQuerySchema` | <2, >4, whitespace, duplicates |
| `resolveSort` / `buildModelsWhere` / `escapeLike` | each filter, combined filters, null handling, wildcard escaping |
| slugify / normalizers | unicode, collisions, price per-token -> per-1M exactness, negative price rejected, modality/capability mapping |
| seed validators | unknown `labSlug`/`providerSlug`/`benchmarkSlug` rejected |
| recompute min price | cheapest active wins, inactive ignored, none -> null |
| mappers | Decimal -> number, null handling, date -> ISO |
| compare alignment | best per benchmark both directions of `higherIsBetter`, missing scores, ties |
| rankings | competition ranking with ties, ordering by `higherIsBetter` |
| `estimateMonthlyCost` | zero tokens, large numbers, rounding |
| `ok` / `toErrorResponse` | status codes, envelope shape, ZodError details, AppError, unknown error hides internals |
| Integration (gated, `RUN_DB_TESTS=1`) | `/api/models` filter+sort+pagination against seeded DB, search finds typo'd name, 404s |
| Playwright smoke (written in M8, run by owner) | search -> filter -> open model -> add to compare -> compare page renders |

## 9. Definition of done (project)
All six assignment requirements work end to end on the deployed URL; CI green; README has architecture diagram, setup, decision log, data honesty, known limitations; `docs/FINAL_TEST_PLAN.md` fully passed; Loom recorded.
