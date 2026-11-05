# Barbershop booking UI specification

## Experience principles

The interface should feel calm, precise, and hospitable. Customers must understand
the price and duration before choosing a time, recover from a lost slot without
re-entering personal details, and never mistake a failed request for a booking.
Management views favor scanability and explicit status actions over decoration.

No paid fonts, photography, icons, or other assets are required. Use system fonts and
simple CSS shapes or text where an icon would otherwise be decorative.

## Design tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#171A1F` | Primary text |
| `--color-muted` | `#5B6472` | Secondary text; keep on white/cream only |
| `--color-canvas` | `#F7F3EC` | Page background |
| `--color-surface` | `#FFFFFF` | Cards and form panels |
| `--color-brand` | `#183A37` | Header, primary actions, selected controls |
| `--color-brand-hover` | `#102A28` | Primary action hover |
| `--color-accent` | `#C7863F` | Small highlights, never body copy on white |
| `--color-border` | `#CBD1D8` | Controls and dividers |
| `--color-focus` | `#1769E0` | Focus ring |
| `--color-danger` | `#B42318` | Error text/border |
| `--color-danger-bg` | `#FEF3F2` | Error notice background |
| `--color-success` | `#176B43` | Success text |
| `--color-success-bg` | `#ECFDF3` | Success notice background |
| `--color-warning` | `#8A4B08` | Pending/conflict text |
| `--color-warning-bg` | `#FFF7E8` | Pending/conflict background |

Core text/background combinations must meet WCAG AA (4.5:1 normal text, 3:1
large text and UI boundaries). Do not communicate appointment status with color alone;
always include its text label.

### Typography

Use `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
sans-serif`, falling back entirely to installed system fonts.

| Style | Mobile | Desktop | Weight / line height |
| --- | --- | --- | --- |
| Display | 36 px | 56 px | 700 / 1.05 |
| Page title | 30 px | 40 px | 700 / 1.15 |
| Section title | 24 px | 30 px | 700 / 1.2 |
| Card title | 18 px | 20 px | 650 / 1.3 |
| Body | 16 px | 16 px | 400 / 1.55 |
| Small | 14 px | 14 px | 400 / 1.45 |

Body copy is limited to 68 characters per line. Prices use tabular numerals when the
font supports them.

### Spacing and shape

Base spacing is 4 px: `1=4`, `2=8`, `3=12`, `4=16`, `5=20`, `6=24`, `8=32`,
`10=40`, `12=48`, `16=64`, `20=80`. Card radius is 12 px; control radius 8 px;
pill radius 999 px. Controls have a minimum 44 by 44 px target. Use a subtle
`0 8px 24px rgb(23 26 31 / 8%)` shadow only for raised panels.

## Responsive frame

### 375 px

- 16 px page gutters; no horizontal scrolling.
- Header is one row with wordmark and one prominent `Book` action. Secondary public
  navigation may wrap below rather than hide essential links in an inaccessible menu.
- Hero, services, booking, login, filters, and appointment cards are single-column.
- Booking step choices and time slots are full-width or a two-column grid only when
  every label fits without truncation.
- Dashboard uses appointment cards; labels precede values. Status actions stack or
  wrap and remain at least 44 px tall.
- Sticky actions are allowed only at the bottom of a step and must not cover focused
  controls or live-region notices.

### 1440 px

- Content max width 1200 px with 32 px gutters.
- Hero uses a 7/5 split; service prices use a three-column grid.
- Booking uses a max-width 800 px centered panel. Progress may be horizontal, while
  the active step content remains one clear reading column.
- Dashboard filters appear in a horizontal bar. Appointments may use a semantic table
  with a minimum row height of 64 px; actions remain visible without hover.

At intermediate widths, layouts wrap naturally; no information may depend on exactly
375 or 1440 px.

## Public landing and prices

Header order is wordmark, `Services`, `Book`, then `Manage` as a subdued link. The hero
contains one H1, a short promise, primary `Book an appointment`, and secondary
`View prices`. Do not place text over an image.

The service section uses cards with service name, short description, duration, and
server-provided formatted price. The entire card is not clickable unless it has one
unambiguous action; prefer a visible `Choose` button. Loading uses three inert skeleton
cards plus status text. An error notice includes `Try again`. An empty state says no
services are currently bookable and does not show a dead booking action.

## Booking flow

One page contains six logical stages: Service, Barber, Date, Time, Details, Confirmed.
Display `Step N of 5` plus named stages; confirmation is not counted as input. Each
stage has one H2 and concise supporting text. Back preserves valid earlier data.

### Service

Radio-card options show name, duration, and price. Selected state combines border,
background, and a checked radio. Loading/error/empty behavior mirrors landing prices.

### Barber

Radio-card options show name and `No preference` only if supported by the API. Empty
copy explains that no barbers provide the selected service and offers `Choose another
service`.

### Date

Use a native date input or accessible calendar with a persistent `Appointment date`
label. Past dates are disabled but server validation is authoritative. Display the
shop timezone near the control. Never offer ambiguous or invalid DST instants.

### Time

Slots are radio buttons formatted in the shop timezone. Group them under `Available
times for {date}`. Loading preserves the group heading and shows status. Empty offers
another date. Fetch error offers retry.

A `409 SLOT_UNAVAILABLE` notice reads: `That time was just booked. Choose another
available time.` It uses warning styling and an assertive announcement. Refresh slots,
clear only time, preserve customer details, and focus the group legend or empty-state
action.

### Customer details

Fields: `Full name`, `Email`, and `Phone` (required status follows the final contract).
Labels remain above inputs; placeholders are examples only. Field errors appear below
their inputs and are referenced by `aria-describedby`. A summary error at the top links
or moves focus to the first invalid field. While submitting, disable repeat submission
and label the action `Booking…`; keep navigation safe from accidental double submits.

### Confirmation

Render only from a `201` response. Use a success heading, appointment reference,
service, barber, local date/time with timezone, server-derived duration/price, customer
contact summary, and next-step/cancellation policy. Primary action returns home. Do not
expose a customer record beyond what is necessary for their own confirmation.

## Login and protected dashboard

Login is a centered panel (maximum 440 px) with labeled username/password controls, a
show-password toggle with accessible name, and `Sign in`. Invalid credentials use a
generic message; server errors offer retry. On submit, use `Signing in…` and prevent
duplicates. Unauthorized `/admin` access returns to login with a safe same-origin
destination only.

Dashboard order: page title and sign-out, filter bar, result summary, appointment
list/table. Filters include labeled date, status, and barber controls plus a visible `Clear
filters` action. Loading announces progress. Empty states distinguish `No appointments
yet` from `No appointments match these filters`.

Appointment rows/cards show local date/time, customer, service, barber, price snapshot,
and a text status badge. Only Pending exposes `Mark completed` and `Cancel appointment`.
Cancellation is destructive: require a lightweight confirmation dialog with initial
focus on its heading or safe action, `Escape` support, focus containment, and focus
return. Completed/Cancelled are read-only. A failed update retains the old status and
shows an inline announced error with retry. A pending update disables both status
actions for that appointment.

## Interaction and accessibility contract

- DOM and focus order follow visual order. A skip link targets main content.
- Use one H1 per page and sequential heading levels.
- Every control has a visible label; icon-only controls need an accessible name and a
  44 px target.
- `:focus-visible` uses a 3 px focus ring with 2 px offset; never remove outlines
  without an equally visible replacement.
- Loading uses `role="status"`; validation and recoverable errors use a polite live
  region; booking conflict and unexpected submission failures may be assertive.
- Focus moves to the active-step heading after Next/Back, the error summary after a
  failed submit, the refreshed time group after conflict, and the confirmation heading
  after success.
- Skeletons and spinners are hidden from assistive technology when adjacent status text
  provides the same meaning. Motion honors `prefers-reduced-motion`.
- Dialogs provide name, description, Escape behavior, focus containment, and focus
  restoration. No keyboard traps exist elsewhere.

## Required state inventory

| Surface | Loading | Empty | Validation/error | Success/ready |
| --- | --- | --- | --- | --- |
| Landing prices | Skeleton + status | No services message | Retry notice | Price cards |
| Services/barbers | Inert option skeletons | Change prior choice | Retry notice | Radio cards |
| Availability | Status in slot group | Choose another date | Retry or conflict refresh | Slot radios |
| Booking submit | Disabled `Booking…` | Not applicable | Field/form/server error | API-backed confirmation |
| Login | Disabled `Signing in…` | Not applicable | Generic auth/server error | Redirect to admin |
| Appointments | Rows/cards skeleton | No data/no matches | Auth/server retry | Filtered list |
| Status update | Per-row disabled actions | Not applicable | Inline retry, old state kept | Returned status replaces row |

## Implementation handoff checklist

- Verify 375 px and 1440 px screenshots for landing, each booking step, confirmation,
  login, and dashboard.
- Test keyboard-only completion, conflict recovery, filters, status confirmation, and
  sign-out.
- Inspect accessible names, field error associations, live announcements, and focus
  restoration.
- Test 200% zoom/reflow and reduced motion.
- Verify no success state exists without an API success response and no customer data
  appears outside authenticated management or the customer's own confirmation.

