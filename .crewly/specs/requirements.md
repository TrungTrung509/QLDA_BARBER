# Barbershop Booking System — MVP Requirements

## 1. Authority, scope, and terminology

This document makes Mission `mission-1793857893021` actionable. The authoritative inputs available in the workspace are:

- Initial goal (Vietnamese): build a modern barbershop management and booking website responsive on desktop and mobile.
- Approved mission objective: responsive landing/prices; online service, barber, date, and time booking with collision prevention; persisted API/database; protected management dashboard.
- Approved checklist `chk-1` through `chk-7` in `.crewly/tasks/checklist-0dbc20b7-d7f7-4705-b183-e08069f2be8d.json`.

The checklist was approved by the orchestrator. No product choices labelled **Assumption** below are represented as owner-approved. They are reversible MVP defaults that keep implementation and testing unblocked.

Normative words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** describe acceptance requirements.

## 2. MVP boundary

### Included

- One shop, with configurable shop identity, IANA timezone, and opening hours.
- Responsive public landing page and readable service/price catalogue.
- Public booking flow: service → barber → local date → available time → customer details → confirmation.
- Duration-aware, collision-safe appointment creation.
- Persisted customers, services, barbers, schedules, and appointments.
- Authenticated management dashboard for listing, filtering, and updating appointment status.
- Loading, empty, validation, conflict, server-error, and success states.
- Local development, migrations, seed data, automated tests, and documentation.

### Excluded from this mission

- Production deployment or publishing.
- Paid integrations, payments, SMS/email delivery, external calendars, and maps.
- Multi-shop tenancy, customer accounts, rescheduling, waitlists, recurring bookings, commissions, payroll, inventory, and analytics.
- Creating services, barbers, or hours through the dashboard. Seed/configuration is sufficient for MVP.

## 3. Roles and access

### Customer (public, unauthenticated)

A customer MAY read active services, prices, active barbers, and bookable availability, and MAY create a booking by supplying contact information. A public response MUST NOT expose another customer's personal data, dashboard data, password material, internal notes, or secrets. The booking confirmation MUST contain only the newly created booking's non-sensitive summary plus its generated identifier.

**Assumption:** customers do not authenticate and cannot cancel or manage bookings in this MVP.

### Administrator (authenticated)

An administrator MAY open the dashboard, list/filter appointments, view customer contact fields needed to manage those appointments, and perform allowed status transitions. All `/api/admin/*` routes and the dashboard MUST require authentication. An unauthenticated request MUST receive `401`; an authenticated identity lacking the admin role MUST receive `403`. The client MUST NOT contain credentials or secrets.

**Assumption:** one seeded admin account and a server-side session cookie are sufficient. The cookie should be `HttpOnly`, `SameSite=Lax`, and `Secure` outside local development. Exact auth library and password hashing implementation are engineering decisions, provided credentials are never stored or compared as plaintext.

## 4. Domain rules

### 4.1 Shop time and schedules

- The shop MUST have one configurable valid IANA timezone (for example, `Asia/Ho_Chi_Minh`); the server MUST NOT rely on the host machine timezone.
- Weekly opening hours and each barber's weekly working hours MUST be configurable, including closed days and multiple intervals per day.
- A barber is bookable only in the intersection of shop hours and that barber's hours.
- All persisted appointment instants MUST be UTC. Public date queries use calendar dates (`YYYY-MM-DD`) interpreted in the configured shop timezone. UI labels display shop-local date/time and identify the shop timezone.
- Daylight-saving gaps/duplicates, if the configured timezone has them, MUST be resolved by generating slots from real instants and converting to local display values. A nonexistent local time MUST never be offered. An ambiguous label MUST be disambiguated or represented with its offset.

**Assumptions:** schedules have no date-specific holidays/breaks in MVP; seeded hours are product demo data, not permanent business policy. Slot starts use a configurable interval with a proposed default of 30 minutes.

### 4.2 Services and durations

- Every active service MUST have a stable ID, display name, non-negative integer price in the configured minor currency unit, positive integer duration in minutes, active flag, and optional description.
- Duration drives availability and collision checks. A booking MUST fit completely inside the applicable shop/barber interval; fitting only its start is insufficient.
- Appointment rows MUST snapshot the service name, duration, price, and currency at creation so later catalogue changes do not rewrite history.

**Assumptions:** one configured currency applies to the shop; price is displayed but no payment is collected; only active services are publicly selectable.

### 4.3 Booking lifecycle

The MVP statuses are:

- `PENDING`: created successfully and blocks barber capacity.
- `COMPLETED`: terminal, records that the service occurred, and continues to block historical capacity.
- `CANCELLED`: terminal and does not block capacity; its former future interval is reusable.

Allowed admin transitions are `PENDING → COMPLETED` and `PENDING → CANCELLED`. Same-state retries MAY be idempotent. All other transitions MUST return a conflict and leave state unchanged.

**Assumption:** a newly created booking starts as `PENDING`; cancelled/completed appointments are immutable, and cancellation has no cutoff or fee in MVP. These policy choices require product confirmation before a future customer self-service feature.

### 4.4 Availability and overlap

- An appointment interval is half-open: `[startAt, endAt)`. Adjacent appointments where one ends exactly when another begins do not overlap.
- Two intervals overlap exactly when `existing.startAt < requested.endAt` and `existing.endAt > requested.startAt`.
- Capacity is per barber. Appointments for different barbers MAY overlap.
- `PENDING` and `COMPLETED` rows block overlapping intervals; `CANCELLED` rows do not.
- Availability MUST account for the selected service duration, active resources, shop/barber hours, current bookings, current shop-local time, and a configurable minimum lead time.
- Past instants MUST never be returned or accepted. The create endpoint MUST revalidate all rules inside the persistence operation; seeing a slot in an earlier availability response is not a reservation.
- Concurrent overlapping creates for the same barber MUST be serialized or protected by a database constraint/transaction so exactly one succeeds. Every loser MUST receive a deterministic `409 SLOT_UNAVAILABLE`; check-then-insert without database-safe serialization is insufficient.
- Cancelling a future `PENDING` appointment MUST make its interval available again, subject to all other rules.

**Assumption:** no buffer time exists before/after a service and minimum lead time defaults to zero unless configured.

## 5. Functional journeys and acceptance

### 5.1 Public experience

1. Landing content and service prices MUST be readable without horizontal overflow at 375 px and 1440 px viewport widths.
2. The booking flow MUST let a customer select an active service and barber, a date, and a duration-valid available time.
3. Each remote step MUST expose loading, empty, and recoverable error states. Inputs MUST retain valid user selections after a recoverable error where possible.
4. Client validation SHOULD give immediate accessible feedback; server validation remains authoritative.
5. On success, the UI MUST show booking ID, status, service, barber, shop-local start/end, duration, and price snapshot. It MUST prevent accidental duplicate submission while the request is pending.
6. A stale/colliding slot MUST show an actionable conflict message and refresh availability rather than claiming success.

### 5.2 Management experience

1. Direct navigation to the dashboard without a valid admin session MUST not reveal dashboard/customer data and MUST lead to authentication.
2. The dashboard MUST list persisted appointments with booking ID, customer name/contact, service/barber snapshots, shop-local start/end, created time, and status.
3. It MUST support filtering at least by status, local date, and barber. Empty and error results MUST be distinct.
4. It MUST support the allowed status transitions with pending, success, validation/conflict, unauthorized, and server-error feedback.
5. Refreshing the dashboard or restarting the application MUST not lose committed data.

## 6. Validation, errors, security, and quality

- The server MUST validate every path, query, and body field; reject unknown enum values, malformed IDs/dates/timestamps, missing required values, invalid phone/email formats, excessive lengths, inactive/missing entities, past slots, schedule violations, and overlaps.
- Error responses MUST use the common envelope in `api-contract.md`, stable machine-readable codes, safe human messages, and field details where useful. They MUST NOT include stack traces, SQL, secrets, hashes, or another customer's information.
- At minimum: `400` malformed request, `401` unauthenticated, `403` unauthorized, `404` absent resource, `409` valid request conflicting with current state/capacity, `422` semantically invalid field/domain input, `429` if rate limiting is implemented, and `500` unexpected failure.
- Booking creation SHOULD be rate limited or otherwise abuse-protected; logs MUST redact customer contact data and credentials.
- Strict TypeScript, lint, typecheck, unit/source tests, integration tests, E2E tests, and production build MUST pass. Critical booking and authorization paths need automated coverage.
- Interactive controls MUST be keyboard operable, visibly focused, programmatically labelled, and announce validation/status updates. Responsive success and error flows require QA at 375 px and 1440 px.
- README MUST document environment variables without real secrets, database migration/seed, demo admin account setup, commands, timezone, opening hours, cancellation policy, and all MVP assumptions.

## 7. Persistence and operational behavior

- A database, not in-memory state, MUST persist customers, barbers, services, schedules, and appointments across clean application restart.
- Schema changes MUST be reproducible through committed migrations. Seed data MUST be deterministic enough for automated tests and local demo use.
- Appointment creation and status changes MUST be atomic. Failed validation/conflict MUST leave no partial customer or appointment write.
- Timestamps MUST be generated/validated server-side. IDs MUST be opaque and unique.
- Database unavailability or unexpected errors MUST produce a safe `500` response and no false success UI.

## 8. Approved checklist traceability

| Checklist | Mission criterion mapped to requirements | Primary evidence |
|---|---|---|
| `chk-1` | Responsive landing/prices at 375 px and 1440 px; complete service/barber/date/time/confirmation flow; loading, empty, and error states | Manual responsive review plus public-flow E2E |
| `chk-2` | Duration-aware availability; invalid/past rejection; database-safe same-barber concurrency with exactly one success; cancelled time reuse | `npm run test:integration` |
| `chk-3` | Customers, barbers, services, schedules, and appointments survive restart; dashboard list/filter and `PENDING`, `COMPLETED`, `CANCELLED` transitions | `npm run test:e2e` including restart persistence |
| `chk-4` | Dashboard/admin endpoints reject unauthenticated/unauthorized access; server validation; no client/repository secrets; customer data restricted to admin/new-booking response | Security inspection and authorization tests |
| `chk-5` | Strict TypeScript, build/lint/source tests; booking and authorization coverage | `npm run lint && npm run typecheck && npm test && npm run build` |
| `chk-6` | Keyboard, label/focus, responsive, success/error QA; zero open critical/high defects | QA matrix and defect report |
| `chk-7` | Local setup, env example, migrations/seed, commands, demo account, timezone/hours/cancellation/MVP assumptions | README review |

## 9. Dependency handoffs

- **Backend:** implement the data invariants and routes in `api-contract.md`; choose and document the database-safe overlap strategy; provide deterministic seed/auth setup and integration tests for boundary, concurrent, cancellation-reuse, persistence, authorization, and error cases.
- **Frontend:** consume only documented response shapes/codes; use server-returned availability; render all states and shop-local time; never infer that a displayed slot remains reserved; protect dashboard routing without treating client guards as authorization.
- **Fullstack:** own root tooling, scripts, migration/seed wiring, environment example, shared type strategy, and README. Ensure all checklist commands exist and compose correctly.
- **QA:** derive tests from Sections 5–8 and the contract examples; specifically race overlapping create requests, restart the server/database, reuse a cancelled slot, verify unauthorized/forbidden responses reveal no data, and test responsive/accessibility/error states.

## 10. Open product confirmations (non-blocking MVP assumptions)

The owner/orchestrator has not explicitly approved these values: shop name/contact/content, timezone, currency, weekly hours, barber schedules, services/prices/durations, slot interval, lead time, cancellation wording/cutoff, customer phone/email requirements, and final visual copy. Seed/config values may be selected for demonstration, must be documented, and must remain configurable rather than encoded as irreversible policy.
