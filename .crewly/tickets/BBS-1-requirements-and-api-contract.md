---
id: BBS-1
title: Requirements and API contract
status: done
priority: P1
assignee: qlda-team-technical-product-manager-fccdd7b1
team: 62132154-1530-4fc7-b0bc-54999a9c7fa8
labels: []
ownerReview: false
createdAt: 2026-11-05T05:58:02.379Z
updatedAt: 2026-11-05T06:03:55.601Z
workItemId: cc144891-de11-49bc-9f4e-4994e86f15e3
requestId: 0dbc20b7-d7f7-4705-b183-e08069f2be8d
source: agent:qlda-team-team-leader-0f797e8a
---

## Description

# Requirements and API contract
Goal: Deliver approved Mission mission-1793857893021 for Barbershop Booking System: responsive landing/prices, online service/barber/date/time booking with collision prevention, persisted API/database and protected management dashboard. Initial scope excludes deployment and paid integrations.
Approved checklist: /home/node/project/Barbershop-Booking-System/.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json (chk-1..7). Parent request 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Shared workspace: only edit your assigned paths; do not overwrite peers. Fullstack owns root/package/lock/tool configuration. Coordinate dependencies through TL and peers. No destructive git actions. Every source file needs a co-located meaningful test; use strict TypeScript and document public interfaces. Report evidence/files/commands and blockers to TL. No production publishing. This is implementation work; start the independent portion now, then continue dependent work once contracts/scaffold exist.

Own .crewly/specs/requirements.md and .crewly/specs/api-contract.md. Extract exact Mission criteria, define customer/admin roles, booking lifecycle, service durations, barber hours, shop timezone, availability/overlap semantics and API/data contract. Propose single-shop MVP with configurable hours/timezone; clearly label assumptions. Coordinate contract with BE/FE/QA immediately, without waiting for complete product discovery. Do not edit root config or implementation.
Expected Outcome: actionable requirements, API/data schema and dependency handoffs. Eval Criteria: map every Mission criterion to chk-1..7; include concurrent overlap, cancellation reuse, unauthorized access, persistence and error cases; no unsupported claims of owner approval.

## Acceptance criteria

_None yet._

## Log

- 2026-11-05T05:58:02.379Z · qlda-team-team-leader-0f797e8a · created (backlog)
- 2026-11-05T05:58:02.514Z · qlda-team-team-leader-0f797e8a · created from delegation by qlda-team-team-leader-0f797e8a
- 2026-11-05T05:58:02.514Z · qlda-team-team-leader-0f797e8a · assigned to qlda-team-technical-product-manager-fccdd7b1 — WorkItem cc144891-de11-49bc-9f4e-4994e86f15e3
- 2026-11-05T06:03:55.601Z · crewly · WorkItem cc144891-de11-49bc-9f4e-4994e86f15e3 verified → done
