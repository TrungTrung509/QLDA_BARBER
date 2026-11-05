# Frontend implementation plan

## Scope and ownership

The frontend owns the public landing, price presentation, booking flow, protected
login/dashboard views, browser-side API integration, accessible interaction states,
and co-located component tests. Root tooling, server routes, persistence, database
migrations, authentication implementation, deployment, and paid integrations are
owned by the corresponding platform/backend workstreams.

The UI must never manufacture a successful booking. A confirmation is rendered only
from a successful appointment-create API response.

## Route map

| Route | Access | Purpose | Primary states |
| --- | --- | --- | --- |
| `/` | Public | Shop introduction, service/pricing summary, booking call to action | loading, populated, service error |
| `/book` | Public | Guided booking from service through confirmation | loading, empty, validation error, API error, slot conflict, confirmed |
| `/login` | Public | Management sign-in | idle, submitting, invalid credentials, server error |
| `/admin` | Authenticated | Appointment management and status filters | loading, empty, populated, unauthorized, server error |

Unauthenticated access to `/admin` redirects to `/login` while retaining a safe
same-origin return path. An API `401` clears browser authentication state and returns
the user to login. Customer details are shown only in authenticated management views.

## Component map

```text
App
├── PublicLayout
│   ├── SiteHeader
│   ├── HomePage
│   │   ├── Hero
│   │   └── ServicePriceList
│   └── BookingPage
│       └── BookingFlow
│           ├── BookingProgress
│           ├── ServiceStep
│           ├── BarberStep
│           ├── DateStep
│           ├── TimeStep
│           ├── CustomerDetailsStep
│           └── BookingConfirmation
├── LoginPage
└── ProtectedRoute
    └── AdminLayout
        └── AppointmentsPage
            ├── AppointmentFilters
            ├── AppointmentList
            └── AppointmentStatusActions
```

Shared UI primitives should be reused from the incoming scaffold/design system.
Feature components own presentation and delegate transport to typed API modules and
server-state hooks. Server responses remain the source of truth; selected step values
are local form state and are invalidated when an upstream choice changes.

## Booking state and API flow

1. Load active services for service and price selection.
2. Load eligible active barbers after a service is selected.
3. Query availability with `serviceId`, `barberId`, and local `YYYY-MM-DD` interpreted
   by the server in the configured IANA shop timezone.
4. Render only returned ISO 8601 UTC slot instants, formatted in the shop timezone.
   The client does not calculate capacity, opening hours, DST validity, duration, or
   overlap rules.
5. Validate labeled customer inputs, then submit the chosen resource IDs, selected
   slot, and customer fields exactly once while the submit action is disabled.
6. Render confirmation from the `201` response, including server-derived duration and
   price snapshots.

Changing a service clears barber, date, and time. Changing a barber clears date and
time. Changing a date clears time. Customer fields survive availability refreshes and
recoverable booking conflicts.

### Concurrent-slot conflict

When create returns `409` with code `SLOT_UNAVAILABLE`, the flow:

1. keeps service, barber, date, and customer details;
2. clears only the selected time;
3. displays and announces that another customer took the slot;
4. refetches availability for the current service/barber/date; and
5. focuses the refreshed time-slot group, or the empty-state action when no slots remain.

Other validation and server errors remain visible near the responsible control or in
an announced form-level error. Failed requests never advance the flow.

## Management flow

The dashboard requests appointments only after authentication is established. Filters
cover at least date and status, including Pending, Completed, and Cancelled. Empty
results distinguish "no appointments" from "no matches for these filters."

For the current MVP contract, only Pending appointments expose actions to transition
to Completed or Cancelled. A mutation is disabled while pending. The returned
appointment replaces cached state on success; an error leaves the previous status
visible and announces the failure. The server remains authoritative for transition
validity and authorization.

## Accessibility and responsive behavior

- Every input has a persistent programmatic label and associated error description.
- Booking steps use headings and a progress label; option groups use semantic
  `fieldset`/`legend` or equivalent accessible grouping.
- Loading indicators expose status text without stealing focus.
- Errors and confirmations use appropriate live regions; focus moves only after a
  user-triggered step change, validation failure, conflict recovery, or route change.
- All actions and choices are keyboard reachable with a visible focus indicator and no
  keyboard trap.
- At 375 px, content uses a single column with full-width tap targets and no horizontal
  overflow. At 1440 px, line length remains bounded and appointment information may use
  a table only when its mobile equivalent remains understandable.

## Test map

Each source file receives a co-located meaningful test. Critical behavior includes:

- landing/prices render service data plus loading and error states;
- upstream booking changes invalidate dependent selections;
- availability loading, empty, error, and selectable slot states;
- labeled customer validation and disabled duplicate submission;
- success is rendered only after a successful create response;
- `409 SLOT_UNAVAILABLE` preserves details, refreshes slots, and announces the conflict;
- protected routing and `401` handling;
- dashboard loading/empty/filter/error states and permitted status actions;
- keyboard operation, focus recovery, and accessible names;
- layout smoke checks at 375 px and 1440 px in the project browser suite.

Final validation is `npm run lint`, `npm run typecheck`, targeted component tests,
the full unit suite, and `npm run build`, followed by browser checks at both required
viewport widths once the shared tooling is available.

## Contract dependencies

Implementation consumes the finalized `.crewly/specs/requirements.md` and
`.crewly/specs/api-contract.md`. Required server guarantees are:

- shop timezone and display metadata;
- active service and eligible barber queries;
- authoritative duration-aware availability;
- atomic appointment create with `409 SLOT_UNAVAILABLE` for a lost race;
- persisted appointment records and server-derived price/duration snapshots;
- authenticated appointment listing/filtering and Pending-to-Completed/Cancelled
  transitions; and
- stable machine-readable error codes with safe user-facing messages.

Until the shared scaffold and these contracts exist, no client transport types or mock
success behavior should be committed based on guesses.
