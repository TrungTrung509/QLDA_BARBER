---
id: BBS-3
title: Application scaffold and local development foundation
status: in_progress
priority: P1
assignee: qlda-team-fullstack-developer-b16830a5
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: []
ownerReview: false
createdAt: 2026-11-05T05:58:17.949Z
updatedAt: 2026-11-05T05:58:18.089Z
workItemId: 02dafe6a-46a5-4cb2-be6b-69bcdd3737b2
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

## Acceptance criteria

_None yet._

## Log

- 2026-11-05T05:58:17.949Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:18.089Z · qlda-team-team-leader-0f797e8a · created from delegation by qlda-team-team-leader-0f797e8a
- 2026-11-05T05:58:18.089Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fullstack-developer-b16830a5 — WorkItem 02dafe6a-46a5-4cb2-be6b-69bcdd3737b2
