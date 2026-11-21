# OneAtlas Loom walkthrough (7–8 minutes)

This is a recording guide, not evidence that the remaining deployment/database checks have passed. Record the live data-backed demo only after Neon is migrated and seeded and the app is deployed or running locally against that database. Do not show `.env`, connection strings, API secrets or personal account data.

## Before recording

- [ ] Neon migration and seed are complete; `/api/health` reports `{ data: { status: "ok", db: true } }`.
- [ ] Start the application or open the deployed URL; test the demo path once.
- [ ] Have two or three model slugs ready for comparison.
- [ ] Have one benchmark category and one provider page ready.
- [ ] Close terminals containing secrets, `.env` files, email and unrelated tabs.
- [ ] Be ready to explain which visible figures are illustrative.

## 0:00–0:35 — Intro and product goal

“Hi, I'm presenting OneAtlas, an AI model discovery and intelligence platform. The goal is to help developers explore models across labs and inference providers, inspect model specifications and pricing, compare options, and understand benchmark results in one place. I built this as a full-stack MVP using Next.js, TypeScript, PostgreSQL and Prisma.”

## 0:35–2:10 — Product walkthrough

1. Start on the home page; introduce search and the price/performance insight.
2. Open `/models`; search for a model and apply one or two filters, then change sorting and view mode.
3. Open a model detail page; point out the lab, context/output limits, modalities/capabilities, provider offerings and benchmark units.
4. Explain the illustrative-data notice. Do not call fixture prices or scores live market data.

## 2:10–3:25 — Comparison and rankings

1. Add two models to comparison and show the persistent compare tray.
2. Open the shareable comparison page and explain row-by-row best values.
3. Open `/rankings`, change benchmark/category, and explain that the ranking direction follows `higherIsBetter`; ties use competition ranks such as 1, 2, 2, 4.

## 3:25–4:15 — Labs, providers and global search

1. Open a lab directory/detail page and show its model release timeline.
2. Open a provider detail page and emphasize that displayed offering prices are from that provider, not the globally cheapest provider.
3. Open the global palette with Cmd/Ctrl+K; demonstrate grouped search and keyboard navigation.

## 4:15–6:15 — Architecture and data flow

Use the README architecture diagram. Explain:

- Interactive UI uses TanStack Query to call real `/api` endpoints; nuqs keeps filters, sorting, pagination and compare state shareable in the URL.
- Route Handlers parse inputs with Zod, call services, and repositories perform Prisma/PostgreSQL access. Mappers convert Decimal values to API DTOs.
- Model search combines PostgreSQL full-text search and `pg_trgm`; the search vector is maintained by a database trigger.
- `ModelProvider` stores provider-specific Decimal prices; denormalized minimum-price fields keep catalogue filtering/sorting efficient.
- Curated seeding works from local JSON; OpenRouter is an optional enrichment path, not a requirement for initial seeding.

## 6:15–7:15 — Engineering decisions, verification and limitations

“Correctness and data honesty were priorities. Query and ranking logic is isolated into pure functions and unit-tested. The local checks passed on my machine: TypeScript, ESLint, 146 Vitest tests and a production build. Browser E2E, database-backed curl checks and production deployment are [state the actual status at recording time]. The curated model specifications, provider prices/associations and numeric benchmark scores are illustrative unless specifically refreshed and source-backed. The MVP also has global rather than faceted filter counts.”

Mention any outstanding security audit finding accurately: the current audit reported transitive `deepmerge-ts` and `effect` findings through Prisma tooling; the forced remediation would cross the Prisma 6 major-version constraint, so it is being handled as a tracked dependency-security follow-up rather than silently upgrading the stack.

## 7:15–7:45 — Close

“That's OneAtlas. The core discovery, detail, comparison, ranking, directory and insight workflows are implemented. The remaining work is to finish the database/deployment acceptance checks and confirm browser-level behavior against seeded data. Thank you.”

## Recording honesty checklist

- [ ] State only tests that were actually run; distinguish unit tests from E2E tests.
- [ ] Never imply that Neon, OpenRouter sync, Vercel or production checks passed unless they did.
- [ ] Label synthetic score and price data as illustrative on screen and verbally.
- [ ] Do not show passwords, database URLs, `.env`, API keys or private dashboards.
- [ ] Keep the final recording within the assignment's 5–10 minute requirement (this script targets 7–8 minutes).
