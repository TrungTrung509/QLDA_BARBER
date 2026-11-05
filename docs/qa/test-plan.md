# Barbershop Booking System QA Test Plan

## Status and scope

This plan covers Mission `mission-1793857893021` and approved checklist
`chk-1` through `chk-7`. Automated cases live in `e2e/`. At the time this plan
was created, the application scaffold and API contract were not yet available;
therefore every case is **Not run**, not passing. Deployment and paid
integrations are out of scope.

Release is blocked by any open Critical or High defect, or by an unexecuted
critical checklist gate.

## Test environment contract

- Browser base URL: `PLAYWRIGHT_BASE_URL` (default: `http://127.0.0.1:5173`).
- API base URL: `E2E_API_URL` (default: `http://127.0.0.1:3001/api`).
- Shop timezone: configurable IANA name; the standard backend seed uses `UTC`.
  The DST scenario requires an isolated `America/New_York` configuration and
  skips rather than giving false coverage when the standard seed is active.
- Seed/reset and restart commands must be supplied by the application scaffold.
- Tests must use an isolated disposable database and deterministic seed IDs.
- Admin credentials must come from server-side test environment variables and
  must never be embedded in client bundles, fixtures, screenshots, or reports.

## Traceability matrix

| Case | Checklist | Priority | Verification | Expected result | Status |
|---|---|---:|---|---|---|
| UI-01 | chk-1, chk-6 | Critical | `booking-flow.spec.ts` at 375x812 and 1440x900 | Landing and prices are readable with no horizontal overflow; booking controls remain usable | Not run |
| UI-02 | chk-1, chk-6 | Critical | `booking-flow.spec.ts` | Service → barber → date → time → customer → confirmation completes with loading, empty and error states announced | Not run |
| UI-03 | chk-6 | High | `booking-flow.spec.ts`, `dashboard.spec.ts` | Keyboard-only flow has logical order, visible focus, accessible names, no trap, and status feedback | Not run |
| API-01 | chk-2 | Critical | `booking-api.spec.ts` | Availability respects service duration and half-open `[start,end)` boundaries | Not run |
| API-02 | chk-2, chk-4 | Critical | `booking-api.spec.ts` | Invalid, malformed, past, inactive, out-of-hours, DST-invalid/ambiguous requests are rejected and not persisted | Not run |
| API-03 | chk-2 | Critical | `booking-api.spec.ts` | Concurrent overlapping creates for one barber yield exactly one `201` and one `409 SLOT_UNAVAILABLE` | Not run |
| API-04 | chk-2 | High | `booking-api.spec.ts` | Same instant for different barbers succeeds independently | Not run |
| API-05 | chk-2, chk-3 | Critical | `booking-api.spec.ts` | Cancelling a Pending appointment releases its capacity for reuse | Not run |
| DB-01 | chk-3 | Critical | `persistence.spec.ts` | Customer, barber, service, appointment and snapshots survive an actual server restart | Not run |
| ADM-01 | chk-3 | Critical | `dashboard.spec.ts` | Authenticated dashboard lists and filters appointments and performs allowed Pending → Completed/Cancelled transitions | Not run |
| SEC-01 | chk-4 | Critical | `security.spec.ts` | Anonymous/invalid sessions cannot view dashboard, customer data, or invoke management endpoints | Not run |
| SEC-02 | chk-4 | Critical | `security.spec.ts` | Input is server-validated; errors do not expose stack/secrets; public responses minimize customer data | Not run |
| SEC-04 | chk-4 | Critical | `security.spec.ts` | Cookie-authenticated state mutation from an untrusted `Origin` is rejected with `403 FORBIDDEN` | Not run |
| SEC-03 | chk-4 | High | manual repository/build scan | No credentials in tracked files or generated client assets | Not run |
| QLT-01 | chk-5 | Critical | checklist command | `npm run lint && npm run typecheck && npm test && npm run build` succeeds with real critical-path coverage | Not run |
| DOC-01 | chk-7 | High | manual README review | Setup, env, migration, seed, test commands, demo account, timezone/hours/cancellation/MVP assumptions are complete | Not run |

## Required preconditions

1. Run the documented database migration and deterministic test seed.
2. Start the app using the scaffold-owned test command and confirm readiness.
3. Reset state before each destructive/concurrency scenario.
4. Use a fixed clock or fixture dates calculated safely in the future; never
   depend on the workstation's local timezone.
5. For persistence, create records, stop the process cleanly, start a new
   process against the same database file, and query through the public/admin
   API. An in-process repository reload is not sufficient.

## Booking oracles

- Blocking statuses: Pending and Completed. Cancelled does not block capacity.
- Intervals are half-open: overlap exists only when
  `existing.start < requested.end && existing.end > requested.start`.
- The server, not the browser, derives duration and price snapshots.
- Two simultaneous same-barber overlapping transactions must atomically produce
  one success and one conflict; serial requests do not prove collision safety.
- Different barbers do not share capacity.
- Local `YYYY-MM-DD` availability is interpreted in the configured shop
  timezone; nonexistent or ambiguous DST local times are not offered.

## Evidence and defect handling

- Retain exact command, exit code, runner output, browser viewport, and a
  screenshot/trace for each UI failure.
- Redact customer data and authentication material from evidence.
- A defect report must include severity, checklist/case, environment, seed,
  numbered reproduction steps, actual result, expected result, and artifact.
- Re-run the direct case and its related regression group after a fix; do not
  close a defect based only on code review.

