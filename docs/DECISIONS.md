# Technical decisions

- 2026-11-21 — Build ingestion Zod enums from the generated Prisma enums so curated input validation stays aligned with the database schema.
- 2026-11-21 — Validate all five curated files as one dataset so bad lab, provider, model and benchmark references fail before any database writes.
- 2026-11-21 — Keep model catalogue metadata, offering prices and demo benchmark scores explicitly illustrative because the project has no live database/source sync yet and the agreed JSON contract has no per-offering provenance field.
- 2026-11-21 — Keep OpenRouter as optional enrichment; offline curated seed data remains sufficient to initialize the app.
- 2026-11-21 — Use 62 model fixtures for M2a to satisfy the detailed spec's 60–80 target; the M2 milestone's separate 100+ definition conflicts and must be reconciled before M2 is declared complete.
- 2026-11-21 — Normalize OpenRouter decimal price strings with Prisma.Decimal before multiplying by 1,000,000, avoiding binary floating-point drift and rejecting negative dynamic-price sentinels.
- 2026-11-21 — Append the lab slug when a model-name slug collides; use a numeric suffix only for a further collision within the same lab so generated slugs remain unique and deterministic.
- 2026-11-21 — Compute both denormalized price fields from the same cheapest active offering; break input-price ties by lower output price for deterministic results.
- 2026-11-21 — Infer VISION only from IMAGE input modality; output image support alone does not imply image understanding.
- 2026-11-21 — Keep the offline `seed` command separate from `sync:openrouter`; external network access must never be required to bootstrap a fresh database.
- 2026-11-21 — Upsert curated rows by slugs/composite keys and OpenRouter rows by `externalId`; do not delete curated rows during source refreshes.
- 2026-11-21 — Treat OpenRouter's single model price as an aggregate OpenRouter offering, not as a claim about separate underlying provider prices.
- 2026-11-21 — Request `output_modalities=all` from the OpenRouter model catalogue so non-text-output models are not silently omitted; normalize the API's evolving extra fields with passthrough Zod objects.
- 2026-11-21 — Keep model query semantics in pure helpers, use parameterized PostgreSQL FTS/trigram lookup for candidate IDs, and convert Prisma Decimal values only in DTO mappers; this keeps route handlers thin and makes sorting/filtering deterministic and unit-testable.

- 2026-11-21 — Compare responses rebuild database results in the request's slug order because SQL `IN` queries do not promise caller order; missing model slugs return a 404 listing the missing values.
- 2026-11-21 — A compare row names a best model only when at least two models have scores and exactly one model leads; missing data or a tied lead is represented as `bestModelSlug: null`.
- 2026-11-21 — Rankings use competition ranking (1,2,2,4), honor each benchmark's `higherIsBetter` flag, and break score ties by model slug for deterministic output.
- 2026-11-21 — When no benchmark slug is supplied, choose the first benchmark ordered by category, name and slug so the default leaderboard is stable.

- 2026-11-21 — Count provider model availability from active `ModelProvider` offerings only, so stale/inactive provider rows do not inflate directory counts.
- 2026-11-21 — Provider detail returns the exact active provider offering alongside each model; price Decimal conversion stays in the catalog mapper, not in Prisma queries or services.
- 2026-11-21 — Lab release timelines sort newest-first with null release dates last and slug as a stable tie-breaker.
- 2026-11-21 — Benchmark model counts are derived from benchmark-score rows; the `(modelId, benchmarkId)` unique constraint makes each score row represent one model for that benchmark.

- 2026-11-21 — Global search reuses the parameterized PostgreSQL FTS/trigram model candidate query, then reapplies its result order after Prisma fetches DTO records because `IN` does not preserve caller order. Lab and provider groups use case-insensitive name matching with deterministic alphabetical ordering.
- 2026-11-21 — Global search applies the requested limit independently to models, labs and providers (default 5, maximum 10); missing or shorter-than-two-character queries return empty groups rather than an error, as specified.
- 2026-11-21 — Filter counts are global catalogue counts, not faceted counts, for the MVP; capability and input-modality counts increment once per model, while provider counts include active offerings only.
- 2026-11-21 — Filter context and input-price ranges ignore null values and return `{ min: null, max: null }` when no model has a value; Prisma Decimal-to-number conversion remains confined to the mapper.

- 2026-11-21 — Add the nuqs Next.js App Router adapter at the root layout and use URL query state for `/models` search, filters, sort, pagination and view mode; shared links reproduce the current explorer state.
- 2026-11-21 — Fetch interactive catalogue results and filter metadata from the documented `/api/models` and `/api/filters` endpoints with TanStack Query; this keeps client interactions on the service/API boundary and avoids import-time or build-time Prisma queries.
- 2026-11-21 — Use native HTML controls and a native `<dialog>` mobile filter drawer instead of adding a component library, preserving accessibility while avoiding new packages.
- 2026-11-21 — Render `/models/[slug]` as a dynamic Server Component and call the existing model service directly; use React request caching to deduplicate the metadata and page reads without adding a second public API endpoint.
- 2026-11-21 — Define related models as sharing the same lab or at least one capability, sort by release date descending with nulls last and slug as a stable tie-breaker, and cap the result at four.
- 2026-11-21 — Show score bars only for percentage-unit benchmarks; display Elo and other raw metrics without a fabricated 0–100 scale. Keep per-score provenance visible and label `source: "illustrative"` values explicitly.

- 2026-11-21 — Persist compare selections in a small versioned localStorage record, validate it on read, synchronize across tabs with the storage event, and cap selections at four; keep the shareable `models` URL parameter as the comparison page source of truth.
- 2026-11-21 — Translate the frontend `/compare?models=` state into the backend contract `/api/models/compare?slugs=` at the fetch boundary rather than changing the API schema.
- 2026-11-21 — Highlight every tied minimum price or maximum capacity in compare rows; benchmark winners come from the API's `bestModelSlug` so lower-is-better metrics and missing-score/tie rules stay consistent with backend logic.

- 2026-11-21 — Build `/rankings` from the existing `/api/benchmarks` and `/api/rankings` contracts with TanStack Query; benchmark rows and scores always come from the database-backed APIs, while the category list mirrors the generated Prisma enum.
- 2026-11-21 — Keep category and benchmark selection in nuqs URL state so leaderboard views are shareable and browser navigation restores the selected benchmark.
- 2026-11-21 — Scale score bars against the benchmark leader and honor `higherIsBetter`; use a min–max fallback for zero/negative scores where a leader-ratio would be undefined. Display the benchmark unit and direction alongside the chart.
- 2026-11-21 — Show an explicit illustrative-data notice on the rankings view because curated benchmark scores are demo data, not verified published leaderboard results.

- 2026-11-21 — Keep labs and provider directory/detail pages as dynamic Server Components that call the existing catalog services directly; all database access stays inside render-time service calls, so pages remain buildable without a configured database.
- 2026-11-21 — Group lab releases by UTC release year, sort individual releases newest-first, and place missing/invalid release dates in an explicit final group rather than silently dropping them.
- 2026-11-21 — Provider detail pricing is rendered from the provider-specific active `offering` DTO, not the model's global cheapest-provider price fields; the displayed prices therefore match the selected provider.
- 2026-11-21 — Implement global search as a native modal dialog using the existing `/api/search` route and TanStack Query; debounce requests, return grouped models/labs/providers, and keep keyboard focus in the search input while arrow/Enter/Escape controls move or open results. No command-palette dependency is needed.


- 2026-11-21 — Price/performance insights use one benchmark per response and blend the cheapest active provider's rates as `(3 × input + output) / 4`, making the cost weighting explicit and stable.
- 2026-11-21 — Resolve the default price/performance benchmark with the same stable category/name/slug ordering as rankings; an explicitly requested unknown benchmark returns a normal 404 envelope.
- 2026-11-21 — Implement the scatter plot as accessible SVG rather than adding a chart dependency; benchmark score direction controls which end of the vertical axis is preferred.
- 2026-11-21 — Monthly cost is `(inputTokens / 1M × inputRate) + (outputTokens / 1M × outputRate)`, rounded to cents; cached-token discounts, taxes and provider minimums are excluded and disclosed.
- 2026-11-21 — Cheapest-provider badges use the lowest active input price and display every provider tied at that price; output price does not redefine the input-price badge.


- 2026-11-21 — Keep Playwright E2E coverage to a Chromium smoke path over the actual seeded API rather than fabricating browser fixtures; the tests intentionally fail with a clear setup message when the catalogue is empty.
- 2026-11-21 — Keep GitHub Actions CI independent of database secrets: run lint, typecheck, Vitest and build with placeholder connection strings, while running seeded-database Playwright smoke tests locally or against an explicitly configured `PLAYWRIGHT_BASE_URL`.
- 2026-11-21 — Add `/api/health` as a dynamic, non-cacheable `SELECT 1` probe; return a generic 503 status without exposing database connection details.


- 2026-11-21 — Keep Next.js `cacheComponents` and `partialPrefetching` disabled while database-backed routes/pages use the required `dynamic = "force-dynamic"` segment config; Next 16 rejects the combination, and preserving the documented dynamic behavior avoids build-time database execution.
- 2026-11-21 — Keep Playwright smoke tests separate from Vitest and require a migrated/seeded database (or explicit `PLAYWRIGHT_BASE_URL`); the tests should exercise the real API rather than pass against hardcoded browser fixtures.
- 2026-11-21 — Defer Neon migrations, seed, curl/API smoke tests and Playwright browser execution until the owner is ready; local typecheck, lint, unit tests and no-database production build have passed but do not prove database integration.
- 2026-11-21 — Do not run `npm audit fix --force` while Prisma 6 is a hard constraint; the owner's audit reports transitive `deepmerge-ts` and `effect` findings through Prisma tooling and proposes a Prisma 7 major upgrade. Track the finding and assess a compatible Prisma 6 remediation before production.
- 2026-11-21 — Documented the 62-model fixture against the detailed specification's 60–80 range and retained the mismatch with the milestone's 100+ wording as an explicit scope issue; do not claim the 100+ target is met.
- 2026-11-21 — README and Loom script distinguish local checks from unverified DB, E2E, CI, deployment and manual UI checks so the take-home submission does not overstate validation.
