# BBS-5 frontend source checks — 2026-11-06

WorkItem: 6553a3b8-fbca-48be-94bd-8e7371cae0d7. Scope confirmed by Team Leader: repair owned frontend source checks without config suppression or API/UI contract changes.

Changes:
- `apps/web/src/features/api.ts`: type aliases, normalized `Headers` for all RequestInit header representations, explicit timestamp match handling and number formatting.
- `apps/web/src/features/api.test.ts`: verifies JSON booking headers and serialized request payload.
- `apps/web/src/pages/AdminPage.tsx`: effect-local appointment loading, complete dependencies, cleanup guards against obsolete results, braced void callbacks and non-deprecated event typing.
- `apps/web/src/pages/PublicBookingPage.tsx`: effect-local availability loading with cleanup guards/dependencies, braced callbacks and event typing.
- `apps/web/src/pages/PublicBookingPage.test.tsx`: braced waitFor callbacks for strict lint.
- `apps/web/src/main.test.tsx`: shared file had existing Fullstack edits; lint autofix braces its void act callback.

Validation:
| Command | Exit | Result |
| --- | --- | --- |
| `./node_modules/.bin/eslint apps/web/src --max-warnings 0` | 0 | No errors or warnings; output captured at `/tmp/bbs5-fe-lint.log`. |
| `npm run typecheck --workspace @barbershop/web` | 0 | TypeScript project build check passed. |
| `npm run build --workspace @barbershop/web` | 0 | 33 modules transformed; production bundle built. |
| `./node_modules/.bin/vitest run apps/web/src` | 0 | 7 test files, 15 tests passed; booking conflict refresh/customer retention, protected management/filtering, routing and API client covered. |
| `git diff --check -- apps/web/src` | 0 | No whitespace errors. |

No current FE dependency blocker. Prior WorkItem blockedReason was `Agent qlda-team-fe-developer-690d736f is not found`; registration and reclaim resolved it. Root/backend checks remain with their owners. This evidence covers frontend source checks and component behavior; browser layout/visual acceptance remains a separate QA gate.

## Follow-up: configured API origin in QA environment

After QA created `.env`, the API client test's hardcoded relative URL failed because `VITE_API_URL` was configured. That failed assertion bypassed inline mock cleanup and contaminated the next header test. Fixed only `apps/web/src/features/api.test.ts`: expected URL honors configured origin and `afterEach` always restores mocks.

Before: targeted API tests exit 1, 2 failed/2 passed (URL mismatch followed by contaminated header assertion).
After:
- `./node_modules/.bin/vitest run --project web apps/web/src/features/api.test.ts`: exit 0, 1 file / 4 tests passed, 18.33 seconds.
- `./node_modules/.bin/eslint apps/web/src/features/api.test.ts --max-warnings 0`: exit 0, no warnings.
- `git diff --check -- apps/web/src/features/api.test.ts`: exit 0.

Full suite final rerun and browser responsive/keyboard acceptance remain under TL/QA independent review. The earlier 15-test result predates the newly created QA `.env`.
