# Barbershop Booking System — MVP API and Data Contract

## 1. Contract conventions

- Base path: `/api`.
- Media type: `application/json`.
- JSON field names use `camelCase`; enum values use `UPPER_SNAKE_CASE`.
- IDs are opaque strings. Clients MUST NOT derive meaning or ordering from them.
- Persisted instants and API timestamps are RFC 3339 UTC strings such as `2026-11-05T09:00:00.000Z`.
- Calendar dates are `YYYY-MM-DD` in the configured shop timezone.
- Money is an integer `priceMinor` plus ISO 4217 `currency`; floating-point money is forbidden.
- Durations are positive integer `durationMinutes`.
- Public collection ordering MUST be stable: services/barbers by configured display order then ID, slots chronologically, appointments by `startAt` then ID unless an endpoint documents otherwise.
- Unknown request fields SHOULD be rejected to expose client/contract drift.
- **Assumption:** same-origin web client, cookie admin session, and no public API version prefix are adequate for MVP.

## 2. Common shapes

```ts
/** Successful response wrapper. */
interface ApiSuccess<T> {
  data: T;
}

/** Safe, stable error response wrapper. */
interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
    requestId?: string;
  };
}

type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "PAST_SLOT"
  | "OUTSIDE_WORKING_HOURS"
  | "SERVICE_NOT_FOUND"
  | "BARBER_NOT_FOUND"
  | "SLOT_UNAVAILABLE"
  | "APPOINTMENT_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

interface Money {
  priceMinor: number;
  currency: string;
}
```

Success responses contain `data` and no `error`; failure responses contain `error` and no `data`. The explicit `204 No Content` login/logout responses are the only success-wrapper exceptions and have an empty body. Error messages are display-safe but clients SHOULD branch on `code`, not message text.

## 3. Data model and invariants

### `ShopSettings`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Singleton record for MVP |
| `name` | string | 1–120 characters |
| `timezone` | string | Valid IANA timezone |
| `currency` | string | ISO 4217 uppercase code |
| `slotIntervalMinutes` | integer | Positive; configurable |
| `minimumLeadMinutes` | integer | Non-negative; configurable |
| `createdAt`, `updatedAt` | UTC instant | Server-managed |

### `WeeklyScheduleInterval`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Opaque unique ID |
| `ownerType` | `SHOP \| BARBER` | Schedule owner |
| `ownerId` | string | Shop/barber FK |
| `weekday` | integer | ISO weekday 1 (Monday) through 7 (Sunday) |
| `startLocalTime`, `endLocalTime` | `HH:mm` | Start < end; intervals for an owner/day MUST NOT overlap |

### `Service`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Opaque unique ID |
| `name` | string | 1–120 characters |
| `description` | string or null | At most 1000 characters |
| `durationMinutes` | integer | Positive |
| `priceMinor` | integer | Non-negative |
| `currency` | string | Matches configured shop currency |
| `isActive` | boolean | Only active services are public/bookable |
| `displayOrder` | integer | Stable catalogue ordering |
| `createdAt`, `updatedAt` | UTC instant | Server-managed |

### `Barber`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Opaque unique ID |
| `name` | string | 1–120 characters |
| `bio` | string or null | At most 1000 characters |
| `isActive` | boolean | Only active barbers are public/bookable |
| `displayOrder` | integer | Stable catalogue ordering |
| `createdAt`, `updatedAt` | UTC instant | Server-managed |

**Assumption:** every active barber can perform every active service. Add an explicit barber-service join later if the seed/business rules require specialization.

### `Customer`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Opaque unique ID |
| `name` | string | Trimmed, 1–120 characters |
| `phone` | string | Normalized and validated, 5–30 characters |
| `email` | string or null | Valid normalized email, max 254 characters |
| `createdAt`, `updatedAt` | UTC instant | Server-managed |

Customer contact fields are admin-only except that the create request echoes no contact data beyond what is necessary to confirm the new booking. Logs and errors MUST redact them.

### `Appointment`

| Field | Type | Rules |
|---|---|---|
| `id` | string | Opaque unique ID |
| `customerId`, `barberId`, `serviceId` | string | Required FKs |
| `startAt`, `endAt` | UTC instant | `endAt` is server-derived as `startAt + duration snapshot` |
| `status` | `PENDING \| COMPLETED \| CANCELLED` | New rows are `PENDING` |
| `serviceName`, `barberName` | string | Immutable display snapshots |
| `durationMinutes` | integer | Immutable service snapshot |
| `priceMinor`, `currency` | integer, string | Immutable service/shop snapshots |
| `createdAt`, `updatedAt` | UTC instant | Server-managed |
| `cancelledAt`, `completedAt` | UTC instant or null | Set by corresponding transition |

Invariant for each barber: no two capacity-blocking appointment intervals overlap. Blocking statuses are `PENDING` and `COMPLETED`; `CANCELLED` is excluded. Intervals are half-open `[startAt, endAt)` and overlap iff `existing.startAt < requested.endAt && existing.endAt > requested.startAt`.

### `AdminUser` / session

Admin user storage requires opaque ID, unique normalized login identifier, password hash (never plaintext), active flag, and server timestamps. A session resolves to an active admin. Session tokens/hashes MUST NOT appear in API bodies or logs.

## 4. Public endpoints

### `GET /api/shop`

Returns public shop settings and weekly shop hours.

```json
{
  "data": {
    "name": "Example Barbershop",
    "timezone": "Asia/Ho_Chi_Minh",
    "currency": "VND",
    "weeklyHours": [
      { "weekday": 1, "startLocalTime": "09:00", "endLocalTime": "18:00" }
    ]
  }
}
```

### `GET /api/services`

Returns active services only.

```json
{
  "data": {
    "services": [
      {
        "id": "svc_opaque",
        "name": "Haircut",
        "description": null,
        "durationMinutes": 30,
        "priceMinor": 100000,
        "currency": "VND"
      }
    ]
  }
}
```

### `GET /api/barbers?serviceId={serviceId}`

Returns active barbers capable of the service. `serviceId` is required if a capability join is implemented; otherwise it MAY be accepted and validated while all active barbers are returned. A missing/inactive service returns `404 SERVICE_NOT_FOUND`.

```json
{
  "data": {
    "barbers": [
      { "id": "barber_opaque", "name": "Alex", "bio": null }
    ]
  }
}
```

### `GET /api/availability?serviceId={id}&barberId={id}&date={YYYY-MM-DD}`

All three query parameters are required. `date` is a shop-local calendar date. The server validates active resources and returns only currently bookable starts whose complete service interval fits working hours and does not overlap a blocking appointment.

```json
{
  "data": {
    "date": "2026-11-06",
    "timezone": "Asia/Ho_Chi_Minh",
    "serviceId": "svc_opaque",
    "barberId": "barber_opaque",
    "durationMinutes": 30,
    "slots": [
      {
        "startAt": "2026-11-06T02:00:00.000Z",
        "endAt": "2026-11-06T02:30:00.000Z",
        "localStart": "2026-11-06T09:00:00+07:00",
        "localEnd": "2026-11-06T09:30:00+07:00"
      }
    ]
  }
}
```

An empty valid day returns `200` with `slots: []`, not `404`. Invalid/malformed date is `422 INVALID_DATE`; past date/time yields no past slots. Missing/inactive service/barber is `404` with the corresponding code.

### `POST /api/appointments`

Request:

```json
{
  "serviceId": "svc_opaque",
  "barberId": "barber_opaque",
  "startAt": "2026-11-06T02:00:00.000Z",
  "customer": {
    "name": "Customer Name",
    "phone": "+84901234567",
    "email": "customer@example.com"
  }
}
```

The client sends no `endAt`, duration, price, status, or snapshots. The server derives them from current active records and validates that `startAt` maps to an offered slot in shop time. Creation MUST be one atomic persistence operation covering customer handling, schedule revalidation, collision prevention, and appointment insertion.

Response: `201 Created`.

```json
{
  "data": {
    "appointment": {
      "id": "apt_opaque",
      "status": "PENDING",
      "service": {
        "id": "svc_opaque",
        "name": "Haircut",
        "durationMinutes": 30,
        "priceMinor": 100000,
        "currency": "VND"
      },
      "barber": { "id": "barber_opaque", "name": "Alex" },
      "startAt": "2026-11-06T02:00:00.000Z",
      "endAt": "2026-11-06T02:30:00.000Z",
      "timezone": "Asia/Ho_Chi_Minh",
      "localStart": "2026-11-06T09:00:00+07:00",
      "localEnd": "2026-11-06T09:30:00+07:00"
    }
  }
}
```

Key failures:

- `422 PAST_SLOT` for a past instant.
- `422 INVALID_TIME` for a non-slot-aligned instant or invalid DST-local mapping.
- `422 OUTSIDE_WORKING_HOURS` if the full interval does not fit.
- `404 SERVICE_NOT_FOUND` / `BARBER_NOT_FOUND` for missing or inactive resources.
- `409 SLOT_UNAVAILABLE` for any overlap/stale availability, including losers of concurrent requests.
- `422 VALIDATION_ERROR` with `fields` for invalid customer input.
- `500 INTERNAL_ERROR` for unexpected persistence failure, with no partial committed appointment/customer.

No availability read reserves capacity. For simultaneous overlapping same-barber requests, exactly one response may be `201`; all other contenders receive `409 SLOT_UNAVAILABLE`. This behavior MUST be guaranteed by the database transaction/constraint/locking design, not only application timing.

## 5. Authentication endpoints

### `POST /api/auth/login`

Canonical request:

```json
{
  "username": "admin",
  "password": "local-demo-password"
}
```

`username` is trimmed, required, and at most 120 characters; `password` is required and at most 256 characters at the API boundary. Success returns `204 No Content` with an empty body and establishes the admin session cookie. Invalid credentials return a generic `401 UNAUTHENTICATED` without identifying which field was wrong. The route SHOULD be rate limited.

### `POST /api/auth/logout`

Invalidates the current session and returns `204 No Content` with an empty body. It is safe to call without an active session.

### `GET /api/auth/session`

Returns the canonical success body below when authenticated; otherwise `401 UNAUTHENTICATED`. It never returns credential or session-token material.

```json
{
  "data": {
    "admin": {
      "id": "admin_opaque",
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

### Cookie-mutation protection

Cookie-authenticated mutation routes (`POST /api/auth/logout` and `PATCH /api/admin/*`, plus any later admin mutation) MUST reject cross-site requests. The server MUST validate an allowed same-origin `Origin` (and fail closed when an unsafe-method origin is absent or invalid) and MUST use a CSRF token mechanism if the chosen deployment/client architecture permits cross-origin requests. `SameSite` cookies are defense in depth, not the only CSRF control. Login MUST validate allowed `Origin` as login-CSRF protection. Local development origins MUST be an explicit configuration allowlist, not a wildcard with credentials.

## 6. Admin endpoints

Every endpoint below requires an authenticated active admin. Middleware MUST run before database output is serialized. `401` and `403` bodies MUST contain no protected resource data.

### `GET /api/admin/appointments`

Supported query parameters:

| Parameter | Type | Meaning |
|---|---|---|
| `status` | appointment status | Optional exact filter |
| `date` | `YYYY-MM-DD` | Optional shop-local calendar date |
| `barberId` | string | Optional exact filter |
| `page` | positive integer | Default 1 |
| `pageSize` | integer | Default 20; maximum 100 |

Response:

```json
{
  "data": {
    "appointments": [
      {
        "id": "apt_opaque",
        "status": "PENDING",
        "customer": {
          "id": "customer_opaque",
          "name": "Customer Name",
          "phone": "+84901234567",
          "email": "customer@example.com"
        },
        "service": {
          "id": "svc_opaque",
          "name": "Haircut",
          "durationMinutes": 30,
          "priceMinor": 100000,
          "currency": "VND"
        },
        "barber": { "id": "barber_opaque", "name": "Alex" },
        "startAt": "2026-11-06T02:00:00.000Z",
        "endAt": "2026-11-06T02:30:00.000Z",
        "localStart": "2026-11-06T09:00:00+07:00",
        "localEnd": "2026-11-06T09:30:00+07:00",
        "createdAt": "2026-11-05T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 },
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

No matches return `200` with an empty array and zero total. Invalid filters return `422 VALIDATION_ERROR`.

### `PATCH /api/admin/appointments/{appointmentId}/status`

Request:

```json
{ "status": "CANCELLED" }
```

Allowed transitions: `PENDING → COMPLETED` or `PENDING → CANCELLED`. Success returns `200` with the updated admin appointment shape. A same-state request MAY return the unchanged record as `200` for idempotency. A missing appointment returns `404 APPOINTMENT_NOT_FOUND`; a disallowed transition returns `409 INVALID_STATUS_TRANSITION` and does not modify the row.

The transition update MUST be atomic. On `CANCELLED`, the appointment ceases to block availability immediately after commit. A subsequent valid create for that interval may succeed. `COMPLETED` remains capacity-blocking for historical integrity.

## 7. Concurrency and transaction contract

The backend implementation MUST document and test its concrete database-safe strategy. Acceptable patterns include a database exclusion constraint on blocking intervals, or a transaction that locks the barber/capacity key before rechecking and inserting. The following observable behavior is mandatory regardless of strategy:

1. Validate resource existence/activity, schedule, slot alignment, and non-past time.
2. Begin the collision-safe transaction/critical section.
3. Re-read blocking appointments and revalidate overlap in that transaction.
4. Insert customer/appointment atomically, deriving `endAt` and snapshots server-side.
5. Commit once; translate expected contention/constraint failures to `409 SLOT_UNAVAILABLE`.
6. Never return `201` until committed; rollback all partial writes on failure.

Integration tests MUST synchronize at least two requests so they contend rather than running accidentally in sequence. For overlapping intervals of the same barber, assert one `201`, remaining `409`, and exactly one blocking row. Also cover adjacent intervals (both succeed), different barbers (both succeed), duration spill past closing (reject), past time (reject), and cancellation followed by reuse (succeed).

## 8. Persistence and authorization test contract

- Seed shop/settings, weekly hours, at least two services with different durations, at least two barbers, and an admin credential sourced from environment/local seed documentation.
- Create an appointment, perform a clean application restart against the same database, then assert services/barbers/customer/appointment and dashboard visibility remain intact.
- Assert all admin endpoints return `401` without a session; if a non-admin identity exists, assert `403`; valid admin receives the expected data.
- Assert public endpoints and error bodies never expose existing customer records, password hashes, sessions, stack traces, SQL, or environment values.
- Assert invalid bodies/queries and missing/inactive resources return the documented status/code and cause no partial writes.

## 9. Client dependency notes

- Render `message` safely, but use `error.code` for flow decisions.
- Treat `slots: []` as a valid empty state and network/5xx as an error state.
- Submit the server-provided UTC `startAt`; do not calculate duration, end, price, or availability in the browser.
- After `409 SLOT_UNAVAILABLE`, keep valid customer/service/barber/date state, clear the stale slot, refetch availability, and ask the customer to choose again.
- Display API-provided local values/timezone or convert UTC using the returned IANA timezone; never assume browser timezone equals shop timezone.
- A client route guard improves UX but never replaces server authorization.

## 10. Assumptions requiring later confirmation

This contract intentionally leaves implementation-configurable values for shop timezone/currency/hours, slot interval, lead time, service catalogue, barber schedules, customer contact requirements, and seed administrator identity. It assumes all barbers provide all services, cookie-based admin sessions, no customer authentication, and no customer cancellation/rescheduling. None of these assumptions is claimed as owner approval.
