# BBS-3 tooling verification

WorkItem: 18b90530-a5d4-4c6a-9338-72760baf4715. Isolated worktree: `/home/node/project/Barbershop-Booking-System-bbs3`. Owned changes copied to shared workspace on TL request, preserving backend modules/database and frontend pages/features.

Changes: register ESLint React plugins, scope typed lint to TS and Node globals to JS; root TS project for configs/e2e; separate Node API/jsdom web test projects; await React mount using act; restore test environment; verify actual TCP health; load root .env for dev/migration/seed; correct API origin example and document seed timezone/hours.

Baseline checks (not BBS-4 acceptance): typecheck and build exit 0, integration 5/5 exit 0. Unit before: 22 passed, main mount test failed due to unawaited React rendering. After: `npm test` 12 files/23 tests pass exit 0 (`/tmp/bbs3-unit-after.log`). Targeted corrected mount test 1/1 exit 0. `npx eslint apps/api/src/server.ts apps/api/src/server.test.ts apps/web/src/main.test.tsx vitest.config.ts apps/web/vite.config.ts` exit 0 (`/tmp/bbs3-owned-lint.log`).

Real smoke: migrated and seeded fresh temporary SQLite database; API health and services returned HTTP 200; web entry HTTP 200 with root mount. No native SQLite error. Shared `npm run typecheck` and `npm run build` exit 0 (`/tmp/bbs3-shared-*.log`). Shared `npm test`: 12 files/33 tests pass, exit 0 (`/tmp/bbs3-shared-unit.log`), 142.90 seconds. Shared `npm run lint`: exit 1, 90 errors and 2 warnings (`/tmp/bbs3-shared-lint.log`), in peer-owned BE/FE/e2e sources. BE/FE/QA notified and fixing their paths; no suppressions added. No all-green or Done claim. Full lint will be rerun after peers land changes.

Exact patch: `/tmp/bbs3-tooling.patch` (includes new root tsconfig). No production deployment. Dependencies reused from existing installation; clean npm ci not repeated against shared node_modules. E2E browser acceptance belongs to QA and was not claimed here.

Root `.env` command smoke: `npm run db:migrate` and `npm run db:seed` exit 0 with a temporary DATABASE_PATH, confirmed file at configured path. Temporary .env removed afterward.

## Peer-fix follow-up

Fresh shared `npm run lint` after peer edits: exit 1, 12 errors/0 warnings (`/tmp/bbs3-shared-lint-followup.log`). Remaining: AdminPage.tsx lines 27/35/38 and PublicBookingPage.tsx 55/56/57 unnecessary conditions; QA booking-api type/array style, dashboard non-null assertions, persistence require-await. No root/tooling violations. BBS-3 remains in_progress; forwarded worker notes contain no final validation evidence.

## Vite transform repair

Reproduced dependency-tree mismatch: web Vite 7.3.7, React plugin resolving root Vite 8.3.6 via Vitest 4.1.12. QA before evidence: `docs/qa/evidence/bbs6-2026-11-06/vite-transform-error.html` and `browser-diagnostic.png` (HTTP500 moduleType/builtin refresh wrapper).

Changed only root package.json (`overrides.vite = 7.3.7`) and package-lock.json for this repair. npm install exit0; npm ls confirms web, React plugin, Vitest and mocker all resolve Vite7.3.7. Installed Vitest peer range accepts Vite6/7/8. No test weakening or frontend product edits.

After: GET /src/main.tsx and /@vite/client HTTP200. Real Chromium mounted #root main, h1 Example Barbershop, zero page errors/HTTP500. Browser result `docs/qa/evidence/bbs3-vite-repair-browser.json`, screenshot `bbs3-vite-repair.png`. Remote Chrome unavailable, used local Playwright with QA-provided browser libs. Smoke exit0. Initial startup collided with unrelated port8787 from .env; preserved it and used WEB_PORT5173 override. Scoped dev session78948 stopped on QA request (SIGINT exit130); QA owns fresh-DB restart. No secret output or .env mutation.

Post-repair root lint/typecheck/build all exit0; logs `/tmp/bbs3-repair-{lint,typecheck,build}.log`. Unit/integration pending at this update because Vite changed test-runner dependency. QA owns complete responsive/keyboard/product acceptance rerun; no Done claim.
