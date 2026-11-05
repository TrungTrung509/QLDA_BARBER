# Backend implementation plan

## Scope and ownership

The backend work is limited to `apps/api/src/modules`, `apps/api/src/db`,
`apps/api/migrations`, and `apps/api/seeds`. The Fullstack owner retains
`apps/api/src/server.ts`, `apps/api/src/index.ts`, root/package/lock files, and
tool configuration. This plan does not cover deployment or paid integrations.

## Runtime contract

- Node.js 22+, ESM, and strict TypeScript.
- A single shop has a configurable IANA timezone and each barber has weekly
  working hours.
- Services and barbers exposed to public booking must be active.
- The server derives duration and price snapshots from the selected service;
  public callers cannot provide authoritative duration or price values.
- API instants use ISO 8601 UTC. Availability accepts a local `YYYY-MM-DD`
  interpreted in the configured shop timezone. Invalid or ambiguous DST wall
  times are not offered.
- Appointment intervals are half-open `[start, end)`. Two intervals overlap
  when `existing.start < requested.end` and
  `existing.end > requested.start`.
- `Pending` and `Completed` appointments consume barber capacity;
  `Cancelled` appointments do not.
- Public appointment creation starts in `Pending`. Admin transitions are
  limited to `Pending -> Completed` and `Pending -> Cancelled`.

The authoritative request, response, validation, and error shapes live in
`.crewly/specs/api-contract.md` once the TPM publishes it.

## Persistence model

The database stores:

- `customers`: stable identifier, normalized contact fields, and timestamps.
- `barbers`: profile, active flag, and weekly working-hour records.
- `services`: name, duration in minutes, price in integer minor units, active
  flag, and timestamps.
- `appointments`: customer/barber/service references, UTC start/end instants,
  immutable service name/duration/price snapshots, status, and timestamps.
- Server-side admin session state or a signed HTTP-only session whose secret
  comes only from server environment configuration.

Migrations are forward-only for the MVP and seed deterministic demo catalog,
hours, and local admin data. The database file is outside build output so data
survives process restarts.

## Atomic booking strategy

Booking performs validation and insertion inside one database transaction:

1. Resolve active service and barber records and derive the requested UTC
   interval from shop-local input.
2. Reject past, invalid, DST-ambiguous, out-of-hours, or malformed intervals.
3. Acquire the database write lock before checking capacity.
4. Query blocking appointments for the barber with the half-open overlap
   predicate.
5. Insert or reuse the normalized customer and insert the `Pending`
   appointment with service snapshots.
6. Commit; map a competing overlap to HTTP `409 SLOT_UNAVAILABLE`.

For SQLite, the transaction must begin in immediate/write mode so two
concurrent requests cannot both observe an empty slot. Busy/constraint errors
are translated to the same stable conflict response only after re-checking the
slot; unrelated database errors remain server errors and are never reported as
successful bookings.

## Feature modules

- Catalog: public service and barber reads.
- Availability: duration-aware slots intersecting barber hours, excluding all
  blocking intervals and past instants.
- Appointments: public creation and protected admin list/filter/status update.
- Authentication: server-side credential validation, secure HTTP-only cookie,
  session verification, and logout. Demo credentials are read from environment
  variables and documented without committing a real secret.
- Error boundary: consistent validation, authentication, authorization,
  not-found, conflict, and internal-error responses without leaking customer
  data or stack details.

Public interfaces receive JSDoc and boundary validation. Each source file has a
co-located meaningful test file.

## Verification

Unit and integration coverage will prove:

- duration-aware availability and adjacent half-open intervals;
- malformed, inactive, past, DST-invalid, and out-of-hours rejection;
- two concurrent overlapping requests yield exactly one success and one
  conflict;
- cancelling a pending appointment reopens its slot;
- only allowed lifecycle transitions succeed;
- unauthorized admin access is rejected and customer data is not returned by
  public endpoints;
- persisted catalog, customers, and appointments survive process restart;
- unexpected database failures use sanitized server-error responses.

Project-level acceptance commands are `npm run test:integration`,
`npm run test:e2e`, and
`npm run lint && npm run typecheck && npm test && npm run build` after the
Fullstack owner completes package and entry wiring.

## Required scaffold handoff

The backend expects the scaffold to provide a SQLite driver with explicit
immediate transactions, a timezone-aware date library, schema validation,
password hashing, secure session support, an HTTP framework, and a test runner
capable of request-level integration tests. Exact package names and scripts
will be agreed with the Fullstack owner before implementation so no backend
work modifies package or lock files.
