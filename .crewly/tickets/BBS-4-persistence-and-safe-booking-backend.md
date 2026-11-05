---
id: BBS-4
title: Persistence and safe booking backend
status: in_progress
priority: P1
assignee: qlda-team-be-developer-ac69e470
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: []
ownerReview: false
createdAt: 2026-11-05T05:58:24.110Z
updatedAt: 2026-11-05T05:58:24.285Z
workItemId: 6dcc9378-0bba-409a-a903-977cec55282c
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

# Persistence and safe booking backend
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Approved checklist: /home/node/project/Barbershop-Booking-System/.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json (chk-1..7). Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Shared workspace: only edit your assigned paths; do not overwrite peers. Fullstack owns root/package/lock/tool configuration. Coordinate dependencies through TL and peers. No destructive git actions. Every source file needs a co-located meaningful test; use strict TypeScript and document public interfaces. Report evidence/files/commands and blockers to TL. No production publishing. This is implementation work; start the independent portion now, then continue dependent work once contracts/scaffold exist.

Own server feature modules and database/migrations/tests under paths agreed with Fullstack; first write docs/backend-plan.md while scaffold is created. Coordinate API contract with TPM and FE. Implement customers/barbers/services/appointments persistence, duration-aware availability, atomic overlap prevention under concurrent requests, past/invalid slot rejection, cancellation release and Pending/Completed/Cancelled state updates. Protect admin endpoints with server-side auth; document local demo auth/session strategy and keep credentials/config server-side. Do not modify root package/lock/entry without Fullstack handoff.
Expected Outcome: real persisted booking/management API and co-located tests. Eval Criteria: chk-2/3/4/5/7; integration test concurrent overlap gives exactly one success; unauthorized calls rejected; data survives restart; cancellation reopens slot; validation and server error handling tested.

## Acceptance criteria

_None yet._

## Log

- 2026-11-05T05:58:24.110Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:24.285Z · qlda-team-team-leader-0f797e8a · created from delegation by qlda-team-team-leader-0f797e8a
- 2026-11-05T05:58:24.285Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-be-developer-ac69e470 — WorkItem 6dcc9378-0bba-409a-a903-977cec55282c
