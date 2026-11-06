# BBS-6 independent QA validation — 2026-11-06

WorkItem `1afcb093-77a4-4267-af5e-cfd1f73f2079` is running. Dispatch poll returned no available work because the item was already running. TL confirmed scope: QA-owned e2e lint fixes and independent chk-1..7 validation. No configuration/rule suppression or backend implementation changes.

## Executed checks

| Command | Exit | Observed output |
| --- | --- | --- |
| `npx eslint e2e --max-warnings 0` | 0 | No output |
| `git diff --check -- e2e` | 0 | No output |
| `npm run test:integration` | 0 | 2 files, 17 tests passed; 25.11s |
| `npm run typecheck` | 0 | API tsc and web tsc completed |
| `npm run build` | 0 | API compiled; web 33 modules transformed |
| `npm run lint` | 1 | Six frontend no-unnecessary-condition errors in AdminPage and PublicBookingPage; concurrent FE edits mean this is a snapshot, not final FE acceptance |
| `npm run test:e2e` | 1 | WebServer node .env not found, exit 9; no tests executed |
| `npm run db:migrate`, `npm run db:seed` | 0 | Completed against disposable `/tmp/bbs6-qa.sqlite` |
| `npm run test:e2e -- --workers=1 --timeout=10000` | 1 | WebServer startup failed; manual `npm run dev` diagnosed inherited WEB_PORT=8787 collision |
| `WEB_PORT=5173 npm run test:e2e -- --workers=1 --timeout=10000` | 1 | Full results in evidence/e2e-initial.log; browser launch absent, repeated API fixtures conflict on second project |

## Environment and test limitations

No .env existed at QA start. Created a local ignored .env from the documented example with a generated local password and isolated `/tmp/bbs6-qa.sqlite`; no existing environment or user database was replaced. Command-scoped WEB_PORT=5173 avoids inherited occupied port 8787 without stopping its owner. Crewly Chrome status is disconnected; Playwright fallback is used. Chromium download is in progress after missing executable was reproduced.

The initial E2E API cases passed concurrency, different-barber capacity, interval boundaries, invalid inputs and anonymous authorization. They do not prove independent-process contention by themselves; the independently rerun integration suite supplies that evidence. The mobile project reuses the desktop project's database and dates, causing existing-booking conflicts: QA fixture isolation failure, not a newly established product defect.

Credentials were not passed as E2E_ADMIN_* in the initial run, so authenticated cancellation/dashboard/cross-origin cases skipped. DST skips under the standard UTC seed. Persistence spec deliberately throws under test.fail and therefore is expected failure, not restart acceptance. The 17-test integration rerun includes real subprocess restart and contention plus DST tests.

## Checklist assessment (interim)

- chk-1 and chk-6: browser UI/keyboard/responsive still unverified; missing Chromium reproduced, installation attempted.
- chk-2: backend integration passed; initial browser-run API capacity assertions passed on first project; second-project isolation defect remains.
- chk-3: backend restart integration passed; browser admin remains unverified and persistence E2E remains placeholder.
- chk-4: backend authorization/Origin/rollback/input regressions passed; anonymous E2E assertions pass; authenticated E2E pending.
- chk-5: QA lint, typecheck, build and integration pass; root lint failed in FE; root unit suite pending.
- chk-7: README includes prerequisites, setup, migration/seed/dev, commands, timezone, half-open intervals, statuses and server-only credentials. Full final spec/implementation consistency remains unaccepted.

Release acceptance remains open. No UI success or mission acceptance is inferred from backend tests.

## Repaired-suite result (supersedes interim pending results)

Command: `LD_LIBRARY_PATH=<local usr/lib>:<local lib> node --env-file=.env <launcher>`; launcher spawns `npm run test:e2e -- --workers=1 --timeout=15000` with command-scoped `WEB_PORT=5173`, `DATABASE_PATH=/tmp/bbs6-repaired.sqlite`, `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD` derived from the disposable server env (no credential literals printed).

Exit **1**: **28 passed, 12 failed, 2 skipped**, 1.8 minutes. Raw log: `evidence/bbs6-2026-11-06/e2e-repaired.log`. QA source lint exit **0**, no output. Current root lint exit **0**, no output beyond command header. Current root unit rerun exit **0**: **12 files, 36 tests passed**, 153.37s. This supersedes the old 34-pass/2-fail snapshot after FE's configured-origin/mock-cleanup fix. Earlier root lint six FE errors were repaired by FE; a subsequent QA helper lint failure was repaired before the passing run.

Actual browser findings: desktop Chromium launches but app is blank. Both `/src/main.tsx` and `/@vite/client` return HTTP500 `Missing field moduleType`, `builtin:vite-react-refresh-wrapper`. FE independently reproduced; tooling owner Fullstack is repairing the Vite/plugin resolution mismatch. Screenshot `evidence/bbs6-2026-11-06/browser-diagnostic.png`, console log and HTTP response alongside it. This is a High tooling/runtime blocker, not an established FE product defect. All six desktop browser tests fail before app controls mount. The project named chromium-mobile inherits iPhone 13's WebKit default; its six browser cases fail due to missing `webkit-2370/pw_run.sh`. WebKit installation attempted next; project names do not establish browser coverage.

Both projects' API cancellation, contention, different-barber, boundary, malformed, auth and Origin cases pass with project-separated booking dates. Both new persistence E2E cases **pass** after actual clean server stop/start against isolated databases, checking authenticated customer/appointment retrieval and overlapping-booking rejection. No expected-failure placeholder remains. The two remaining skips are DST E2E under UTC seed, explicitly **not accepted as passing**; independent integration17/17 includes actual DST gap/fold tests.

Updated mapping: chk-2 backend + real HTTP E2E passed; chk-3 real restart E2E passed but browser dashboard blocked; chk-4 API authorization/Origin/input passed, browser privacy blocked; chk-5 lint/unit/typecheck/build/integration passed at captured snapshots; chk-1/chk-6 all-step375px/keyboard/feedback remain blocked by served-module500 and missing mobile browser. chk-7 README reviewed, runtime reproduction below documents tooling gap. Mission acceptance remains open.

## Non-root browser dependency reproduction

All extracted artifacts under `/tmp` are transient. No system packages, unrelated services or dependency configuration were changed by QA.

1. `npx playwright install chromium` (exit0) downloaded the browser; launch then failed missing `libglib-2.0.so.0`.
2. `npx playwright install-deps chromium` failed exit1: `su: Authentication failure`. It did not establish acceptance.
3. Create `/tmp/bbs6-browser-libs/lists/partial` and `packages`; run `apt-get -o Dir::State::lists=/tmp/bbs6-browser-libs/lists -o APT::Get::List-Cleanup=0 update` (uses existing Debian sources; only local indexes). Default apt cache cleanup hook prints permission errors against system cache; QA did not change/remove that cache.
4. In the local packages directory run `apt-get -o Dir::State::lists=/tmp/bbs6-browser-libs/lists download libglib2.0-0 libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libdbus-1-3 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libxcb1 libxkbcommon0 libasound2 libatspi2.0-0 libxau6 libxdmcp6 libdrm2 libxi6 libxtst6 libxrender1 libwayland-server0 libbsd0`.
5. Extract each downloaded `.deb` with `dpkg-deb -x <package> /tmp/bbs6-browser-libs/root`. Set command-scoped `LD_LIBRARY_PATH=/tmp/bbs6-browser-libs/root/usr/lib/x86_64-linux-gnu:/tmp/bbs6-browser-libs/root/lib/x86_64-linux-gnu`. `ldd` then reports no missing Chromium libraries; actual browser launch succeeded.
6. Before rerunning browser acceptance, Fullstack must hand back served `/src/main.tsx` and `/@vite/client` HTTP200 with real app mount. QA's Playwright-owned dev server exited after the failed run; restart is coordinated with Fullstack. Existing occupied port8787 is preserved.
