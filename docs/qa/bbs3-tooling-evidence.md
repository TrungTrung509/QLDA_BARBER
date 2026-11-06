# BBS-3 tooling verification

WorkItem: 18b90530-a5d4-4c6a-9338-72760baf4715. Isolated worktree: `/home/node/project/Barbershop-Booking-System-bbs3`. Owned changes copied to shared workspace on TL request, preserving backend modules/database and frontend pages/features.

Changes: register ESLint React plugins, scope typed lint to TS and Node globals to JS; root TS project for configs/e2e; separate Node API/jsdom web test projects; await React mount using act; restore test environment; verify actual TCP health; load root .env for dev/migration/seed; correct API origin example and document seed timezone/hours.

Baseline checks (not BBS-4 acceptance): typecheck and build exit 0, integration 5/5 exit 0. Unit before: 22 passed, main mount test failed due to unawaited React rendering. After: `npm test` 12 files/23 tests pass exit 0 (`/tmp/bbs3-unit-after.log`). Targeted corrected mount test 1/1 exit 0. `npx eslint apps/api/src/server.ts apps/api/src/server.test.ts apps/web/src/main.test.tsx vitest.config.ts apps/web/vite.config.ts` exit 0 (`/tmp/bbs3-owned-lint.log`).

Real smoke: migrated and seeded fresh temporary SQLite database; API health and services returned HTTP 200; web entry HTTP 200 with root mount. No native SQLite error. Shared `npm run typecheck` and `npm run build` exit 0 (`/tmp/bbs3-shared-*.log`). Shared `npm test`: 12 files/33 tests pass, exit 0 (`/tmp/bbs3-shared-unit.log`), 142.90 seconds. Shared `npm run lint`: exit 1, 90 errors and 2 warnings (`/tmp/bbs3-shared-lint.log`), in peer-owned BE/FE/e2e sources. BE/FE/QA notified and fixing their paths; no suppressions added. No all-green or Done claim. Full lint will be rerun after peers land changes.

Exact patch: `/tmp/bbs3-tooling.patch` (includes new root tsconfig). No production deployment. Dependencies reused from existing installation; clean npm ci not repeated against shared node_modules. E2E browser acceptance belongs to QA and was not claimed here.

Root `.env` command smoke: `npm run db:migrate` and `npm run db:seed` exit 0 with a temporary DATABASE_PATH, confirmed file at configured path. Temporary .env removed afterward.
