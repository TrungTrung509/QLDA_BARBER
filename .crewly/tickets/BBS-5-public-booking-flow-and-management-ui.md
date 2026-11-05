---
id: BBS-5
title: Public booking flow and management UI
status: in_progress
priority: P1
assignee: qlda-team-fe-developer-690d736f
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: []
ownerReview: false
createdAt: 2026-11-05T05:58:29.515Z
updatedAt: 2026-11-05T05:58:29.804Z
workItemId: 9f293852-c62d-42e4-a42a-b90859309515
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

# Public booking flow and management UI
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Approved checklist: /home/node/project/Barbershop-Booking-System/.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json (chk-1..7). Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Shared workspace: only edit your assigned paths; do not overwrite peers. Fullstack owns root/package/lock/tool configuration. Coordinate dependencies through TL and peers. No destructive git actions. Every source file needs a co-located meaningful test; use strict TypeScript and document public interfaces. Report evidence/files/commands and blockers to TL. No production publishing. This is implementation work; start the independent portion now, then continue dependent work once contracts/scaffold exist.

Own client UI modules/co-located tests; first document docs/frontend-plan.md and route/component map while scaffold/design/contracts arrive. Coordinate with Designer, TPM, Fullstack, BE. Implement responsive landing/prices, service→barber→available date/time→customer details→confirmation backed by real API, protected login/dashboard, appointment listing/filter/status update. Handle empty/loading/conflict/validation/server errors. No root package/lock edits without Fullstack handoff.
Expected Outcome: complete public/admin UI wired to API, responsive and accessible. Eval Criteria: chk-1/3/4/5/6; no static fake booking success; show concurrent-slot conflict and refresh availability; keyboard usable, inputs labeled, 375/1440px checked; meaningful component tests.

## Acceptance criteria

_None yet._

## Log

- 2026-11-05T05:58:29.515Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:29.804Z · qlda-team-team-leader-0f797e8a · created from delegation by qlda-team-team-leader-0f797e8a
- 2026-11-05T05:58:29.804Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-fe-developer-690d736f — WorkItem 9f293852-c62d-42e4-a42a-b90859309515
