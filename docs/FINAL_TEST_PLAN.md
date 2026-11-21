# Final test plan (run after all coding is done)

Tick each box. Paste any failure to the assistant with the exact output.

## A. Local, no database
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build` (must succeed without a DB)

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
- [ ] `curl.exe "http://localhost:3000/api/health"` -> ok
- [ ] `/api/models?limit=5`
- [ ] `/api/models?q=claude` and a typo `q=cluade`
- [ ] `/api/models?capability=TOOLS,VISION&sort=price`
- [ ] `/api/models?limit=9999` -> 400 envelope
- [ ] `/api/models/does-not-exist` -> 404 envelope
- [ ] `/api/models/compare?slugs=<a>,<b>` and with 1 slug (400) and 5 slugs (400)
- [ ] `/api/rankings?benchmark=<slug>`, `/api/search?q=gp`, `/api/filters`, `/api/labs`, `/api/providers`

## D. UI walkthrough
- [ ] Home: search works, sections render with real data
- [ ] /models: search, each filter, sort, pagination, grid/table, clear filters, empty state
- [ ] URL sharing: copy a filtered URL into a new tab, same results
- [ ] Detail page: offerings table, benchmarks, similar models, 404 for bad slug
- [ ] Compare tray -> /compare with 2, 3, 4 models; best-value highlights
- [ ] Rankings: switch category/benchmark
- [ ] Labs and providers lists and detail pages
- [ ] Cmd/Ctrl+K palette: type, arrows, enter, esc
- [ ] Responsive: 375px, 768px, 1440px (browser devtools)
- [ ] Keyboard only: tab through filters, palette, drawer

## E. Automated end-to-end
- [ ] `npx playwright install chromium` then `npx playwright test`

## F. Deploy
- [ ] Push to GitHub; import into Vercel; set `DATABASE_URL` (pooled) and `DIRECT_URL`
- [ ] `npx prisma migrate deploy` against the production DB; run the seed against production
- [ ] Live URL: repeat sections C and D on the live site, on your phone, and in incognito
- [ ] Lighthouse on `/models` and a detail page
- [ ] `git grep -n "postgresql://"` shows only `.env.example`
- [ ] CI is green on GitHub

## G. Submission
- [ ] README complete, Loom (5-10 min) recorded, form submitted with 1h+ buffer
