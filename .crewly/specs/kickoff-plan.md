# Barbershop Booking System — implementation kickoff

Mission: mission-1793857893021 (approved). Request: 0dbc20b7-d7f7-4705-b183-e08069f2be8d.
Design checklist generated and explicitly approved by orchestrator before assignments. See ../tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json.

## Scope and verification
Responsive landing/prices, service/barber/time booking, persisted customer/service/barber/appointment API, protected management dashboard and Pending/Completed/Cancelled lifecycle. Concurrent overlapping bookings and authorization are mandatory gates. Local setup and QA included; deployment and paid integrations excluded.

## Assignments
| Work | Owner | Project record | Output ownership |
|---|---|---|---|
| Requirements/API contract | TPM | BBS-1 | .crewly/specs/requirements.md, api-contract.md |
| Responsive design | FE, before UI implementation | BBS-2 | docs/design/ |
| Scaffold/tooling | Fullstack | BBS-3 | root configuration, apps/web and apps/api entry wiring, README |
| Booking/persistence/auth | BE | BBS-4 | apps/api/src/modules, db, migrations, seeds |
| Public/admin interface | FE | BBS-5 | apps/web/src feature/component/page/style modules |
| Test matrix/E2E | QA | BBS-6 | docs/qa/, e2e/ |

Designer delivery failed because its session name contains a slash (raw 404, encoded 400). Undelivered assignment cancelled and BBS-2 reassigned to FE; orchestrator approved fallback and owns session repair. Designer acknowledged no duplicate work.

## Sequence
TPM contract + responsive design + scaffold + QA matrix begin independently. Fullstack announces module layout and runner setup; BE and FE implement against shared contract; QA automates real flows as app becomes available. FE completes design before interface implementation. No overlapping ownership of root package/lock files. TL reviews artifacts and relevant checks before accepting outputs; one-shot event watchers and 90-minute fallback checks are set per active worker.

Initial stack baseline: TypeScript React frontend, Node API and SQLite local persistence. Fullstack owns dependency selection and setup. Single-shop configuration, timezone/opening hours and policy assumptions must be explicit in requirements rather than implied owner decisions.
