---
id: BBS-6
title: QA scenarios and end-to-end verification
status: in_progress
priority: P1
assignee: qlda-team-tester-3e1b565d
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: []
ownerReview: false
createdAt: 2026-11-05T05:58:35.003Z
updatedAt: 2026-11-05T05:58:35.250Z
workItemId: 22125ecd-22df-414b-97f1-cb3758745ae0
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

# QA scenarios and end-to-end verification
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Approved checklist: /home/node/project/Barbershop-Booking-System/.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json (chk-1..7). Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Shared workspace: only edit your assigned paths; do not overwrite peers. Fullstack owns root/package/lock/tool configuration. Coordinate dependencies through TL and peers. No destructive git actions. Every source file needs a co-located meaningful test; use strict TypeScript and document public interfaces. Report evidence/files/commands and blockers to TL. No production publishing. This is implementation work; start the independent portion now, then continue dependent work once contracts/scaffold exist.

Own docs/qa/ and e2e/ tests; first produce executable test plan and fixtures from Mission/checklist now, then implement tests against scaffold/API as available. Coordinate with Fullstack on runner/scripts, TPM on acceptance, BE on concurrency fixtures. Cover full booking journey, persistence after restart, concurrent same-barber overlap, different barbers, duration boundaries, invalid/past dates, cancellation reuse, auth/authorization, dashboard status and mobile/desktop keyboard flows. Do not edit feature implementation; report reproducible defects to TL.
Expected Outcome: traceable test matrix, automated E2E/security/concurrency verification and defect report. Eval Criteria: chk-1..7 mapped to concrete cases; execution evidence with real exit codes/screenshots as appropriate; no claim of passing tests before app exists; critical/high defects remain explicit release blockers.

## Acceptance criteria

_None yet._

## Log

- 2026-11-05T05:58:35.003Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:35.250Z · qlda-team-team-leader-0f797e8a · created from delegation by qlda-team-team-leader-0f797e8a
- 2026-11-05T05:58:35.250Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-tester-3e1b565d — WorkItem 22125ecd-22df-414b-97f1-cb3758745ae0
