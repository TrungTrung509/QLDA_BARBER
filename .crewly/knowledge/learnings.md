# Project Learnings: Barbershop-Booking-System

This file contains learnings discovered during development.

---

## 2026-11-05

### [qa/qlda-team-tester-3e1b565d] 06:04:39
Task blocked: Produced chk-1..7 traceability plan, fixtures, Playwright booking/concurrency/security/dashboard/persistence specs, and defect log. Real verification remains blocked: root dependencies are absent (typecheck exits 127), feature UI/API routes are not implemented, and BE deterministic seed/auth/reset/restart hooks are pending. All critical gates remain explicitly Not run; no false pass claimed.

---

## 2026-11-05

### [qa/qlda-team-tester-3e1b565d] 06:05:23
Task blocked: Independent QA plan and executable-intent Playwright artifacts are complete and map chk-1..7. Automated verification is blocked by missing Fullstack-owned dependency install/package lock, scaffold-only feature routes, and pending BE deterministic seed/admin/reset/clean-restart hooks; all critical gates remain Not run.

---

## 2026-11-06

### [backend-developer/qlda-team-be-developer-ac69e470] 17:03:33
[[BBS-4]] Legacy barber_hours seed/runtime already use ISO Monday=1 through Saturday=6 despite 0..6 constraint. Migration 002 preserves 1..6 and maps only Sunday 0->7. Independent application subprocesses with IPC barrier prove contention; Promise.all over synchronous handlers in one loop does not. Retry evidence: docs/backend-retry-evidence-2026-11-06.md.

---

## 2026-11-06

### [fullstack-dev/qlda-team-fullstack-developer-b16830a5] 17:07:00
[[BBS-3]] Tooling milestone verified by TL: shared unit 33/33, typecheck/build exit0; owned lint exit0. Shared full lint exit1 with peer-owned BE/FE/QA violations; keep in_progress until peers fix. Evidence docs/qa/bbs3-tooling-evidence.md and /tmp/bbs3-tooling.patch. Node API/jsdom UI projects, React main test act, root env loading and API origin without /api repaired. Root migrate/seed smoke exit0. TL relinked active WorkItem 18b90530-a5d4-4c6a-9338-72760baf4715 after stale Done metadata. No repeat checks until relevant changes land.

---

## 2026-11-06

### [backend-developer/qlda-team-be-developer-ac69e470] 17:07:58
[[BBS-4]] Explicit America/New_York DST regression exposed availability offering a 01:30 spring-forward interval rejected by create. Availability now omits intervals whose end wall minute differs from configured duration; create returns 422 INVALID_TIME across clock changes. Fall-back repeated local times reject both actual instants. Final targeted lint, API typecheck/build, integration 17/17, DB 4/4 and focused DST 2/2 passed. Retry submitted for independent verification; refreshed evidence docs/backend-retry-evidence-2026-11-06.md.

---

## 2026-11-06

### [frontend-developer/qlda-team-fe-developer-690d736f] 17:10:43
[[BBS-5]] Current booking implementation is PublicBookingPage.tsx. Strict frontend lint requires type aliases, braced void handlers, SyntheticEvent instead of deprecated FormEvent, and normalized Headers. Async effect cancellation checks use a helper function to avoid TypeScript narrowing across await causing no-unnecessary-condition false positives. Source lint and web typecheck/build pass; component suite pending.

---

## 2026-11-06

### [frontend-developer/qlda-team-fe-developer-690d736f] 17:13:49
[[BBS-5]] QA-created .env enables VITE_API_URL and exposes hardcoded relative URL expectations in frontend API tests. Failed assertions bypass inline mockRestore, polluting later tests and creating misleading Content-Type failures. Tests should honor configured API origin and restore mocks in afterEach regardless of assertion outcomes.

---

