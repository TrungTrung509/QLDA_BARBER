# QA Defect Report

## Current release assessment

**Not testable / release gates open.** The initial workspace contains no
application scaffold, API, database, test runner, or runnable scripts. This is
not an application defect by itself because implementation is concurrently in
progress, but all Critical checklist gates remain unverified.

The root scaffold and runner configuration subsequently appeared, but feature
routes, database hooks, deterministic seed data, and installed dependencies are
still pending. `npm run typecheck` was attempted on 2026-11-05 and exited `127`
because `tsc` is not installed (`node_modules` is absent). This is recorded as
an environment/dependency blocker, not a product defect.

## Open defects

None recorded yet. Add reproducible product failures below; do not list missing
in-progress implementation as a defect until its owning work is reported ready.

## Template

### DEF-NNN — concise customer-visible failure

- Severity: Critical / High / Medium / Low
- Checklist and case:
- Build/commit:
- Environment and viewport:
- Seed/preconditions:
- Steps to reproduce:
  1. …
- Actual result:
- Expected result:
- Reproducibility:
- Evidence:
- Regression coverage:
- Status: Open / Ready for retest / Closed


## 2026-11-06 independent validation update

Historical scaffold/dependency blockers above are superseded by `bbs6-validation-2026-11-06.md`. Root lint/unit/typecheck/build and integration pass at captured snapshots. Repaired E2E: 28 passed, 12 failed, 2 skipped; browser acceptance remains open.

### DEF-001 — Development website is blank because module transforms return HTTP500

- Severity: High, runtime/tooling blocker; chk-1/chk-6 and browser admin coverage blocked.
- Environment: documented dev setup, disposable SQLite seed, Chromium156; 375px and1440px cases attempted.
- Steps: run documented dev setup with WEB_PORT=5173; open `/`; fetch `/src/main.tsx` and `/@vite/client`.
- Actual: both modules return HTTP500 `Missing field moduleType`, plugin `builtin:vite-react-refresh-wrapper`; page body is empty.
- Expected: module requests succeed and public booking mounts.
- Reproducibility: QA browser + curl; independently confirmed by FE.
- Evidence: `evidence/bbs6-2026-11-06/browser-diagnostic.png`, `.log`, `vite-transform-error.html`, `e2e-repaired.log`.
- Owner/status: Fullstack BBS-3 dependency resolution repair in progress; no FE product attribution. Await served-module200 and app-mount verification before rerun.

### QA environment gap — iPhone project requires WebKit

- Project label `chromium-mobile` spreads iPhone13 device defaults, selecting WebKit. Browser binary absent; six mobile UI cases failed before launch. WebKit install attempted. No mobile-browser acceptance claimed; no product bug inferred.
- Chromium dependency installation succeeded through local extracted shared libraries; system installer failed due to unavailable root credentials. Reproduction is in BBS-6 validation artifact.
