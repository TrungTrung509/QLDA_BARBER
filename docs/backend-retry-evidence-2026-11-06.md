# BBS-4 retry evidence — 2026-11-06 UTC

Status: refreshed implementation ready for independent review; not accepted or marked done. Supersedes the earlier 15-test evidence; all final checks below passed. Changes are in the shared working tree, without a new commit. Existing unrelated changes belong to peers and were preserved.

## Changed files

- `apps/api/src/modules/api.ts`: require exact configured Origin on login/logout/authenticated status mutations; distinguish invalid alignment/ambiguous local mapping (422 INVALID_TIME), duration outside working hours (422 OUTSIDE_WORKING_HOURS), and overlap (409 SLOT_UNAVAILABLE).
- `apps/api/migrations/002_iso_barber_weekday.sql`: atomic forward rebuild accepting ISO weekdays 1..7. Existing seed and runtime use Monday=1 through Saturday=6; retain these values, map only legacy Sunday=0 to 7. Original migration remains intact. Repeated migration runs preserve intervals. No customer, appointment, or session tables are rebuilt. Rollback on successful upgrade is intentionally not supplied because reverting would reject valid Sunday=7 records; legacy SQL remains available for audit.
- `apps/api/src/modules/api.test.ts`: missing/disallowed Origin on login/logout/authenticated PATCH; invalid minute/second alignment, outside hours/closed day, adjacent intervals, different barbers, overlap, duration spill, Sunday availability/create, transaction rollback with sanitized injected DB failure, invalid/inactive resources, privacy and unauthorized mutation.
- `apps/api/src/modules/api.integration.test.ts` and `apps/api/src/modules/fixtures/booking-process.mjs`: independently running application processes, IPC armed/go barrier, one winner/one conflict and exactly one customer/appointment; clean process shutdown/restart preserves customer contact, appointment, admin session and blocking interval. Uses the production createApp factory with deterministic injected time and separate native SQLite connections.
- `apps/api/src/db/database.test.ts`: upgrade from original legacy schema, preserve every schedule interval, map 0 to 7, rerun migrations, accept 7/reject 0, verify foreign keys.

## Commands and results

| Exact command | Exit | Output |
| --- | --- | --- |
| `npm run typecheck --workspace @barbershop/api` | 0 | `tsc -p tsconfig.json --noEmit` |
| `npm run build --workspace @barbershop/api` | 0 | `tsc -p tsconfig.build.json` |
| `npm run test:integration` | 0 | Test Files 2 passed (2); Tests 17 passed (17); Duration 17.68s |
| `npx vitest run apps/api/src/db` | 0 | Test Files 3 passed (3); Tests 4 passed (4); Duration 6.30s |
| `git diff --check -- apps/api` | 0 | No output |
| `npx eslint apps/api/src/modules/api.ts apps/api/src/modules/api.test.ts apps/api/src/modules/api.integration.test.ts apps/api/src/modules/fixtures/booking-process.mjs apps/api/src/db/database.test.ts` | 0 | No output; all five targeted paths pass, without suppressions/config changes |

The final integration run includes the two new DST regressions and passes 17 tests. Focused DST after-fix command below passes 2 tests (13 unrelated tests skipped), exit 0, duration 4.46s. The failing-before DST run is retained below. Original Origin/time/Sunday failures are reproduced in the rejected review. Intermediate lint runs failed before source fixes; the final targeted lint exits 0.

## Acceptance evidence

- Origin policy: missing and foreign Origin each return 403 for login/logout/authenticated PATCH; failed PATCH leaves appointment PENDING and failed logout preserves session.
- Validation: 09:01 and nonzero seconds return 422 INVALID_TIME; 18:00 and closed Sunday return 422 OUTSIDE_WORKING_HOURS; full-duration spill rejected; true overlap returns 409 SLOT_UNAVAILABLE.
- Scheduling: ISO Sunday availability and booking succeed after inserting Sunday schedules. Adjacent bookings and other barbers succeed; cancellation/terminal-state regressions remain passing.
- Contention: both processes acknowledge the barrier before release; actual independent HTTP applications return sorted [201,409], loser SLOT_UNAVAILABLE, one persisted appointment and customer.
- Restart: terminate first application cleanly with exit 0, start another process on same file, retrieve customer/appointment through authenticated admin API, reject overlapping booking with 409.
- Rollback: SQLite trigger aborts appointment insert after customer creation; API returns only generic INTERNAL_ERROR, both table counts stay zero, removing trigger permits booking.
- Migration: upgrade original 0..6 schema, preserve Monday..Saturday, map Sunday 0->7, rerun safely, verify foreign_key_check empty.

Fullstack repaired shared root ESLint configuration through their ownership. Backend source/style/type issues revealed by lint were fixed without suppressions or config edits. No root/frontend modifications made by this agent. Independent TL/QA acceptance remains pending.

## Final focused DST check

`npx vitest run --config vitest.integration.config.ts apps/api/src/modules/api.test.ts -t 'DST boundaries'`: exit 0; Test Files 1 passed (1), Tests 2 passed | 13 skipped (15), Duration 4.46s.

## DST regression captured before correction

Command: `npx vitest run --config vitest.integration.config.ts apps/api/src/modules/api.test.ts -t 'DST boundaries'`

Before fix: exit 1; 1 failed, 1 passed, 13 skipped. Assertion at api.test.ts:211: expected false, received true for an offered `2030-03-10T01:30` local start in America/New_York. The 30-minute interval crosses the spring-forward clock jump, contradicting the create validation. Availability now omits intervals whose end wall time does not advance by the configured duration; create rejects such intervals with 422 INVALID_TIME.

UTC input semantics: a nonexistent local wall time has no corresponding UTC instant. Gap evidence therefore asserts absence of local 02:xx slots on 2030-03-10, absence of the 01:30 interval crossing the gap, presence of valid 03:00 slots, and 422 INVALID_TIME for the real 01:30 -05:00 instant whose duration crosses the jump. An offset-bearing 02:30 string is itself a real UTC instant and is not falsely treated as a nonexistent instant. On fall-back Sunday 2030-11-03, both 01:30 -04:00 and 01:30 -05:00 are real instants with the same ambiguous shop wall time: availability omits both and create returns 422 INVALID_TIME for either.

