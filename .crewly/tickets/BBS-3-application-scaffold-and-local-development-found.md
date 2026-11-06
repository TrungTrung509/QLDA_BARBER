---
id: BBS-3
title: "[Scaffold] Restore local tooling and verify application entry wiring"
status: in_progress
priority: P1
assignee: qlda-team-fullstack-developer-b16830a5
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: [ Chore ]
ownerReview: false
createdAt: 2026-11-05T05:58:20.000Z
updatedAt: 2026-11-06T17:05:41.208Z
workItemId: 18b90530-a5d4-4c6a-9338-72760baf4715
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

# Application scaffold and local development foundation
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Approved checklist: /home/node/project/Barbershop-Booking-System/.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json (chk-1..7). Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Shared workspace: only edit your assigned paths; do not overwrite peers. Fullstack owns root/package/lock/tool configuration. Coordinate dependencies through TL and peers. No destructive git actions. Every source file needs a co-located meaningful test; use strict TypeScript and document public interfaces. Report evidence/files/commands and blockers to TL. No production publishing. This is implementation work; start the independent portion now, then continue dependent work once contracts/scaffold exist.

Own root configuration/package lock, README, app/server entry wiring and tooling. Establish TypeScript React frontend + Node API + SQLite local persistence foundation (adjust with documented reason if existing project constraints emerge). Establish ownership with BE (server modules/db) and FE (client UI), reserve entry wiring. Provide npm run dev, lint, typecheck, test, test:integration, test:e2e, build interfaces; do not create misleading passing placeholder tests. Setup environment example, gitignore, test runners and seed/migration wiring with BE. Announce path layout and runnable scaffold immediately to unblock peers; do not overwrite implementation files.
Expected Outcome: runnable local skeleton, real smoke test, clear module layout and setup documentation. Eval Criteria: chk-5/7, strict TS, build and meaningful smoke test pass; test scripts honestly report missing dependent tests until implemented; no credentials committed.

## Context & Business Goal
Restore approved local scaffold; deployment and paid integrations excluded.
## Technical Scope & Architecture
Fullstack-owned root tooling/config/lock/docs and API server + web entry wiring/tests. Preserve peer module/page edits.
## Input / Output & Data Contracts
Root .env loads credentials and DATABASE_PATH. API 3001, web 5173. VITE_API_URL is origin without /api. Node API and jsdom UI tests.
## Edge Cases & Error Handling
Native SQLite must match runtime; missing dependencies/credentials fail explicitly; no suppressed failures. Await React mount and close TCP listener.
Priority & Type: P1 / Chore. Assignee: Fullstack Developer. Active WorkItem: 18b90530-a5d4-4c6a-9338-72760baf4715.

# Application scaffold and local development foundation
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Expected Outcome: runnable local skeleton, real smoke test, clear module layout and setup documentation.
Eval Criteria: chk-5/7, strict TS, build and meaningful smoke test pass; test scripts honestly report missing dependent tests until implemented; no credentials committed.

## Context & Business Goal
Restore local scaffold and tooling for the approved mission, reusing existing implementation. Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d; approved checklist .crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json.
## Technical Scope & Architecture
Fullstack owns root package.json/package-lock.json, TypeScript/ESLint/Vitest/Playwright configurations, README.md, .env.example, apps/api/src/server.ts and tests, apps/web/src/App.tsx/main.tsx and tests. React frontend, Node API, SQLite. Preserve BE modules/db and FE feature/page ownership. npm dev starts API 3001 and web 5173; no deployment or paid integrations.
## Input / Output & Data Contracts
Environment-only admin credentials, DATABASE_PATH, API origin without /api suffix; canonical API contract unchanged. Root migration/seed commands load .env. API tests use node, frontend tests jsdom. Document setup and all real validation commands.
## Edge Cases & Error Handling
Native SQLite must match Linux/Node runtime. Missing credentials/dependencies fail clearly. No placeholder passes or suppressed failures. TCP listener smoke must close DB cleanly; React mount test awaits act. Shared peer lint failures remain explicit blockers.
Priority & Type: P1 / Chore. Specialized assignee: Fullstack Developer.
Active WorkItem: 18b90530-a5d4-4c6a-9338-72760baf4715; old WorkItem references in historical log are retained for audit.

## Acceptance criteria

- [ ] Given a clean documented environment, when dependencies install and migrations/seed run, then both local applications start and health and web routes respond.
- [ ] Given current application sources, when lint/typecheck/build and meaningful scaffold smoke tests run, then all pass without suppressions or placeholder success.
- [ ] Given backend tests and frontend component tests, when test commands run, then each uses its appropriate environment and results are honestly reported.
- [ ] Given README and .env.example, when a new developer follows setup, then credentials, migrations, timezone/hours and validation commands are documented without real secrets.

## Log

- 2026-11-05T05:58:20.000Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:20.100Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fullstack-developer-b16830a5 — WorkItem ee345891-ff11-49bc-9f4e-4994e86f15g5
- 2026-11-06T15:42:00.000Z · crewly · WorkItem ee345891-ff11-49bc-9f4e-4994e86f15g5 verified → done
- 2026-11-06T17:03:51.272Z · qlda-team-fullstack-developer-b16830a5 · Implemented isolated tooling fixes in Barbershop-Booking-System-bbs3 and applied only Fullstack-owned config/entry/test/docs paths to shared workspace per TL request. Node/jsdom test separation, React act mount regression, environment API origin and root .env loading repaired. Baseline typecheck/build/integration exit 0 and TCP/API+web smoke 200. Full lint now exposes peer source violations; shared verification pending. No Done claim.
- 2026-11-06T17:05:02.295Z · qlda-team-fullstack-developer-b16830a5 · updated labels, description, acceptance criteria
- 2026-11-06T17:05:24.041Z · qlda-team-fullstack-developer-b16830a5 · updated labels, description, acceptance criteria — Recovered scope and unchecked AC per TL; status in_progress update rejected by API (use claim or assign). TL must relink existing running work item; historical log retained.
- 2026-11-06T17:05:41.010Z · qlda-team-team-leader-0f797e8a · done → ready — TL reconciliation: stale done state conflicts with running scaffold repair 18b90530-a5d4-4c6a-9338-72760baf4715 and pending shared validation; reopen to link existing work, no duplicate task.
- 2026-11-06T17:05:41.208Z · qlda-team-team-leader-0f797e8a · linked to WorkItem 18b90530-a5d4-4c6a-9338-72760baf4715 (running, qlda-team-fullstack-developer-b16830a5) by qlda-team-team-leader-0f797e8a
