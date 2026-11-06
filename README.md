# Barbershop Booking System

Local-first, single-shop appointment booking with a React frontend, Node API, and SQLite persistence. Deployment and paid integrations are outside the initial scope.

## Prerequisites

- Node.js 20.20 or newer
- npm 10 or newer

## Local setup

1. Copy `.env.example` to `.env` and replace all local demo secrets.
2. Install dependencies with `npm install`.
3. Apply schema changes with `npm run db:migrate`.
4. Load local demo records with `npm run db:seed`.
5. Start the API and web app together with `npm run dev`.

The web app runs at `http://127.0.0.1:5173`; the API runs at `http://127.0.0.1:3001`, with health at `/api/health`.

Root commands load `.env`; database paths are relative to the repository root. Run commands from that directory. If dependencies were copied from another OS or Node version and SQLite reports an invalid native binary, run `npm rebuild better-sqlite3`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run web and API watchers together |
| `npm run lint` | Enforce strict TypeScript and React lint rules |
| `npm run typecheck` | Type-check every workspace |
| `npm test` | Run co-located unit and smoke tests |
| `npm run test:integration` | Run backend `*.integration.test.ts` suites |
| `npm run test:e2e` | Start both apps and run Playwright specs in `e2e/` |
| `npm run build` | Create production API and web builds |
| `npm run db:migrate` | Apply SQLite migrations |
| `npm run db:seed` | Seed local demo data |

Integration and E2E commands deliberately fail if their independently owned suites are absent.

## Module ownership

- `apps/web/src/main.tsx` and `App.tsx`: DOM and route-shell entry wiring (Fullstack)
- `apps/web/src/features`, `components`, `pages`, `styles`: customer and admin UI (Frontend)
- `apps/api/src/server.ts`: HTTP entry wiring (Fullstack)
- `apps/api/src/modules`, `db`, `migrations`, `seeds`: API and persistence (Backend)
- `e2e` and `docs/qa`: browser scenarios and QA evidence (QA)
- `.crewly/specs/api-contract.md`: canonical transport and error contract (TPM)

Every source module must have a meaningful co-located test. Public interfaces require JSDoc and strict TypeScript.

## MVP assumptions

- The system serves one shop using the IANA timezone stored in `shop_settings` (demo seed: `UTC`).
- Weekly barber hours control availability; timestamps cross the API as ISO 8601 UTC instants.
- Appointment intervals are half-open: `[start, end)`.
- Pending and Completed appointments block capacity; Cancelled appointments release it.
- The API derives service duration and price snapshots instead of trusting client values.
- Local demo admin credentials are read only by the API through `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Never expose passwords through `VITE_*` variables.
- Demo shop and barber hours are Monday–Saturday, 09:00–17:00 UTC, with 30-minute slots; Sunday is closed. Seed data contains no admin password. Choose `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` and use those values on the management login. `VITE_API_URL` is the API origin without `/api`; the client adds the route prefix.

See `.crewly/specs/requirements.md` and `.crewly/specs/api-contract.md` for the final product and API contract once published.
