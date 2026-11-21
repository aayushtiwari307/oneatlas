# Final test plan (run after all coding is done)

Tick each box. Paste any failure to the assistant with the exact output.

## A. Local, no database
Owner-reported on 2026-11-21 after applying the M8 root integration fix: all four checks below completed successfully. Re-run after any later code or dependency changes.
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` — 146 tests passed across 27 files
- [x] `npm run build` — production build completed without a configured/reachable Neon database

## B. Database (do this once coding is finished)
1. Create a Neon project. Copy BOTH connection strings (pooled -> `DATABASE_URL`, direct -> `DIRECT_URL`) into `.env`.
2. `npx prisma migrate dev --name init --create-only`
3. Open the new `prisma/migrations/*_init/migration.sql`. Paste PART 1 of `prisma/sql/search_setup.sql` at the very TOP and PART 2 at the BOTTOM.
4. `npx prisma migrate dev`  (if it complains about a shadow database, tell the assistant)
5. `npm run seed`
- [ ] Neon SQL editor: `SELECT count(*) FROM "Model";` is 60+ and `SELECT count(*) FROM "ModelProvider";` is greater than 0
- [ ] `SELECT name, "searchVector" FROM "Model" LIMIT 3;` shows a non-null vector (proves the trigger works)
- [ ] Optional: `npm run sync:openrouter`

## C. API smoke (with `npm run dev` running; PowerShell)
- [ ] `curl.exe "http://localhost:3000/api/health"` -> HTTP 200 with `{ data: { status: "ok", db: true } }`; unavailable DB returns a generic HTTP 503 with `db: false` and no connection details
- [ ] `/api/models?limit=5`
- [ ] `/api/models?q=claude` and a typo `q=cluade`
- [ ] `/api/models?capability=TOOLS,VISION&sort=price`
- [ ] `/api/models?limit=9999` -> 400 envelope
- [ ] `/api/models/does-not-exist` -> 404 envelope
- [ ] `/api/models/compare?slugs=<a>,<b>`; 1 slug, 5 slugs, duplicates and whitespace-only input return 400; unknown slug returns 404 with missing list
- [ ] `/api/rankings?benchmark=<slug>` and `/api/rankings?category=CODING&limit=10`; verify lower-is-better benchmark ordering and competition-rank ties
- [ ] `/api/benchmarks` and `/api/benchmarks?category=CODING`
- [ ] `/api/labs` and `/api/labs/<known-slug>`; unknown lab slug -> 404 envelope
- [ ] `/api/providers` and `/api/providers/<known-slug>`; unknown provider slug -> 404 envelope
- [ ] `/api/search?q=gp` returns grouped models/labs/providers (each group respects `limit`, default 5)
- [ ] `/api/search?q=g` returns empty groups; `/api/search?q=gp&limit=11` -> 400 validation envelope
- [ ] `/api/filters` returns global counts and ranges; compare lab/model counts with DB; provider count includes active offerings only
- [ ] `/api/filters?unexpected=1` -> 400 validation envelope (unknown query parameters rejected)
- [ ] `/api/insights/price-performance` returns points for a stable default benchmark; `/api/insights/price-performance?benchmark=<slug>` uses that benchmark; unknown explicit slug -> 404 envelope

Known API limitation: `/api/filters` exposes global (not faceted) counts for the MVP, as specified.

## D. UI walkthrough
- [ ] Add/remove models from compare on grid cards, table rows and detail pages; selection persists after refresh and is capped at 4
- [ ] Compare tray appears across routes, remove/clear actions work, and share URL uses `/compare?models=`
- [ ] `/compare`: 1 model shows guidance, 2–4 models render side-by-side, 404 unknown slug is handled, best price/context/benchmark values highlight correctly including ties and missing scores
- [ ] Home: search works, sections render with real data
- [ ] /models: search, each filter, sort, pagination, grid/table, clear filters, empty state
- [ ] URL sharing: copy a filtered URL into a new tab, same results
- [ ] Detail page: offerings table, benchmarks, similar models, 404 for bad slug
- [ ] Compare tray -> /compare with 2, 3, 4 models; best-value highlights
- [ ] Rankings: switch category/benchmark; verify URL updates, direction label, competition-rank ties, score bars, lab links and input price; confirm illustrative-data notice is visible
- [ ] Labs and providers lists and detail pages
- [ ] `/labs`: verify directory count and each lab card opens the matching detail page
- [ ] `/labs/<slug>`: verify model timeline groups by release year, newest-first; null/invalid dates appear in the final unknown-date group
- [ ] `/providers`: verify active offering counts and directory links
- [ ] `/providers/<slug>`: verify model table uses this provider's active offering prices (not the global cheapest-provider price), sorted by input price
- [ ] Cmd/Ctrl+K palette: open from any route, type at least 2 characters, verify groups for models/labs/providers, use arrows and Enter, close with Escape and backdrop click
- [ ] Cmd/Ctrl+K: query shorter than 2 characters should not issue a search request; retry UI appears if `/api/search` fails
- [ ] Home price/performance chart: choose multiple benchmarks, verify lower blended price plots left and the benchmark-preferred score direction plots up; inspect SVG point tooltips and illustrative-data notice
- [ ] Model detail cost calculator: change provider and monthly input/output tokens; independently verify formula `(input tokens × input rate + output tokens × output rate) / 1,000,000`; zero tokens should show $0.00; confirm estimate caveats are visible
- [ ] Provider pricing: every provider tied for the lowest active input price shows the cheapest-input badge; higher output price alone must not change this badge
- [ ] Responsive: 375px, 768px, 1440px (browser devtools)
- [ ] Keyboard only: tab through filters, palette, drawer and cost calculator; focus rings remain visible
- [ ] Reduced-motion preference: confirm animations/transitions are minimized
- [ ] Accessibility: chart has a useful accessible name; form controls have labels; verify color contrast and focus order

## E. Automated end-to-end
**Deferred by owner until Neon setup.** Playwright smoke tests require a migrated and seeded Neon database (or a running deployment configured through `PLAYWRIGHT_BASE_URL`). The browser download was previously interrupted; a successful `npm run test:e2e` result has not yet been reported.
- [ ] Run `npm install` once after applying M8 to synchronize `package-lock.json` with the new pinned `@playwright/test` dependency; commit both manifest and lockfile
- [ ] `npx playwright install chromium`
- [ ] `npm run test:e2e` (two smoke tests: model search + type filter + detail + add-to-compare; then two-model comparison page)
- [ ] Optional external target: set `$env:PLAYWRIGHT_BASE_URL="https://your-deployment.example"` before `npm run test:e2e`

## F. Deploy
- [ ] Push to GitHub; import into Vercel; set `DATABASE_URL` (pooled) and `DIRECT_URL`
- [ ] `npx prisma migrate deploy` against the production DB; run the seed against production
- [ ] Live URL: repeat sections C and D on the live site, on your phone, and in incognito
- [ ] Lighthouse on `/models` and a detail page
- [ ] `git grep -n "postgresql://"` shows only `.env.example`
- [ ] CI is green on GitHub

## G. Submission
- [ ] README complete, Loom (5-10 min) recorded, form submitted with 1h+ buffer

## M4a — App shell and model explorer
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build` (must succeed without a database)
- [ ] With Neon migrated and seeded, open `/models` and confirm results load from `/api/models`.
- [ ] Search a model name; confirm 300ms debounce and results update.
- [ ] Apply lab, provider, type, capability, input-modality, minimum-context and maximum-price filters individually and in combination.
- [ ] Sort by newest, input price, context window and name.
- [ ] Change grid/table mode and pagination; copy a filtered URL into a new tab and confirm the same state is restored.
- [ ] Verify loading skeleton, API error/retry and empty/reset states.
- [ ] At 375px, open and use the native-dialog filter drawer; at 768px and 1440px verify the layout and keyboard focus.

## M4b — Model detail page
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build` succeeds without a database; `/models/[slug]` stays dynamic and performs no import-time query.
- [ ] With Neon migrated and seeded, open a known `/models/<slug>` and verify name, lab, type, release date and description.
- [ ] Verify context window, max output, modalities and capabilities match the `/api/models/<slug>` response.
- [ ] Verify only active provider offerings appear; the lowest input-price offering(s) are highlighted; input/output/cached prices use USD per 1M tokens.
- [ ] Verify benchmark units, higher/lower-is-better labels, dates and source links; illustrative rows have an explicit notice. Percentage bars appear only for percentage units; raw metrics such as Elo are not normalized.
- [ ] Verify related models share the lab or at least one capability and no more than four are shown.
- [ ] Unknown or invalid slug displays the segment 404; temporarily unavailable database/API displays retry state.
- [ ] Verify 375px, 768px and 1440px; provider table scrolls horizontally without breaking the page.


## M7 — Differentiators and polish
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build` without a configured database
- [ ] With Neon seeded, verify `/api/insights/price-performance` for default and explicit benchmark slugs and 404 behavior for an unknown slug
- [ ] Verify the chart's blended price matches the cheapest active offering using `(3 × input + output) / 4` and that preferred benchmark direction appears at the top
- [ ] Verify the detail-page calculator for zero, normal and large token volumes; compare its output to an independent calculation; note it excludes cached-input discounts and taxes
- [ ] Verify all tied lowest-input offerings receive the cheapest badge
- [ ] Check homepage, model detail, labs/providers, compare and rankings at 375px, 768px and 1440px
- [ ] Check keyboard focus, input labels, chart accessible name, reduced-motion behavior and contrast


## M8 — CI and browser smoke tests
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build` with placeholder/no reachable database; build must not execute database queries
- [ ] Confirm `.github/workflows/ci.yml` is green on GitHub after committing `package-lock.json`
- [ ] Confirm CI uses no production database credentials and E2E tests are run separately against seeded data


## H. Security and dependency follow-up
- [x] `npm audit` was run after the M8 dependency installation; owner reported four high-severity findings associated with transitive `deepmerge-ts` and `effect` dependencies pulled through Prisma tooling.
- [ ] Review the full audit details and assess a compatible Prisma 6 remediation; do **not** use `npm audit fix --force` because npm proposed a Prisma 7 major upgrade, which violates the project constraint.
- [ ] Re-run `npm audit` after a compatible dependency update and record the result.
- [ ] Review Prisma's `package.json#prisma` deprecation warning and move seed configuration to a Prisma config file in a version-compatible change before any Prisma major upgrade.

## I. Current owner-reported local verification (2026-11-21)
- [x] TypeScript: `npm run typecheck` passed.
- [x] ESLint: `npm run lint` passed.
- [x] Vitest: 146 tests passed across 27 files.
- [x] Production build: `npm run build` completed; build output listed the model, lab, provider, compare, rankings and API routes, with database-backed routes shown as dynamic.
- [ ] Neon migrations, SQL extension/trigger verification and seed.
- [ ] API curl smoke tests against populated PostgreSQL.
- [ ] Playwright Chromium smoke tests against populated PostgreSQL.
- [ ] Vercel deployment, live URL walkthrough, Lighthouse, visual/responsive and keyboard/accessibility checks.
- [ ] Loom recording and Google Form submission.
