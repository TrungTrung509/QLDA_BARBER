import type Database from 'better-sqlite3';
import { DateTime } from 'luxon';
import type { Express, NextFunction, Request, Response } from 'express';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

type Status = 'PENDING' | 'COMPLETED' | 'CANCELLED';

/** Runtime-only secrets and browser policy needed by API routes. */
export interface ApiConfig {
  adminUsername: string;
  adminPassword: string;
  allowedOrigin: string;
  secureCookies: boolean;
}

/** Dependencies injected into the API to keep server startup and tests isolated. */
export interface ApiDependencies {
  database: Database.Database;
  config: ApiConfig;
  now?: () => Date;
}

interface ShopRow {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  slot_interval_minutes: number;
  minimum_lead_minutes: number;
}

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  currency: string;
}

interface BarberRow { id: string; name: string; bio: string | null }

class ApiFailure extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly fields?: Record<string, string>) {
    super(message);
  }
}

const querySchema = z.object({ serviceId: z.string().min(1), barberId: z.string().min(1), date: z.iso.date() }).strict();
const bookingSchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  startAt: z.iso.datetime({ offset: true }),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(5).max(30),
    email: z.email().max(254).nullable().optional(),
  }).strict(),
}).strict();
const loginSchema = z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(256) }).strict();
const statusSchema = z.object({ status: z.enum(['COMPLETED', 'CANCELLED']) }).strict();
const adminQuerySchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  date: z.iso.date().optional(),
  barberId: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
}).strict();

function equalSecret(left: string, right: string): boolean {
  const a = createHash('sha256').update(left).digest();
  const b = createHash('sha256').update(right).digest();
  return timingSafeEqual(a, b);
}

function sessionHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cookies(request: Request): Record<string, string> {
  return Object.fromEntries((request.headers.cookie ?? '').split(';').map((part) => part.trim().split('='))
    .filter((entry): entry is [string, string] => entry.length === 2));
}

function shop(database: Database.Database): ShopRow {
  const row = database.prepare('SELECT * FROM shop_settings LIMIT 1').get() as ShopRow | undefined;
  if (!row) throw new ApiFailure(500, 'INTERNAL_ERROR', 'Shop configuration is unavailable');
  return row;
}

function service(database: Database.Database, id: string): ServiceRow {
  const row = database.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(id) as ServiceRow | undefined;
  if (!row) throw new ApiFailure(404, 'SERVICE_NOT_FOUND', 'Service was not found');
  return row;
}

function barber(database: Database.Database, id: string): BarberRow {
  const row = database.prepare('SELECT * FROM barbers WHERE id = ? AND active = 1').get(id) as BarberRow | undefined;
  if (!row) throw new ApiFailure(404, 'BARBER_NOT_FOUND', 'Barber was not found');
  return row;
}

function localParts(instant: Date, timezone: string): { date: string; minute: number; weekday: number; label: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  const minute = Number(get('hour')) * 60 + Number(get('minute'));
  const weekdays: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { date, minute, weekday: weekdays[get('weekday')] ?? 0, label: DateTime.fromJSDate(instant, { zone: timezone }).toISO({ suppressSeconds: true, suppressMilliseconds: true })! };
}

function localCandidates(date: string, minute: number, timezone: string): Date[] {
  const local = DateTime.fromISO(`${date}T${minuteLabel(minute)}`, { zone: timezone });
  if (!local.isValid || local.toFormat('yyyy-MM-dd') !== date || local.hour * 60 + local.minute !== minute) return [];
  return local.getPossibleOffsets().map((candidate) => candidate.toJSDate());
}

function offeredSlots(database: Database.Database, serviceRow: ServiceRow, barberRow: BarberRow, date: string, now: Date, includeBlocked = false) {
  const settings = shop(database);
  const probe = localCandidates(date, 720, settings.timezone)[0];
  if (!probe) return [];
  const weekday = localParts(probe, settings.timezone).weekday;
  const hours = database.prepare(`SELECT MAX(b.start_minute, s.start_minute) AS start_minute,
    MIN(b.end_minute, s.end_minute) AS end_minute FROM barber_hours b
    JOIN shop_hours s ON s.weekday = b.weekday WHERE b.barber_id = ? AND b.weekday = ?
    AND MAX(b.start_minute, s.start_minute) < MIN(b.end_minute, s.end_minute)`)
    .all(barberRow.id, weekday) as Array<{ start_minute: number; end_minute: number }>;
  const blocking = database.prepare(`SELECT start_at, end_at FROM appointments
    WHERE barber_id = ? AND status IN ('PENDING','COMPLETED')`).all(barberRow.id) as Array<{ start_at: string; end_at: string }>;
  const earliest = now.getTime() + settings.minimum_lead_minutes * 60_000;
  const slots: Array<{ startAt: string; endAt: string; localStart: string; localEnd: string }> = [];
  for (const interval of hours) {
    for (let minute = interval.start_minute; minute + serviceRow.duration_minutes <= interval.end_minute; minute += settings.slot_interval_minutes) {
      const starts = localCandidates(date, minute, settings.timezone);
      if (starts.length !== 1 || starts[0]!.getTime() < earliest) continue;
      const start = starts[0]!;
      const end = new Date(start.getTime() + serviceRow.duration_minutes * 60_000);
      const localEnd = localParts(end, settings.timezone);
      if (localEnd.date !== date || localEnd.minute !== minute + serviceRow.duration_minutes || localCandidates(date, localEnd.minute, settings.timezone).length !== 1) continue;
      if (!includeBlocked && blocking.some((item) => Date.parse(item.start_at) < end.getTime() && Date.parse(item.end_at) > start.getTime())) continue;
      slots.push({ startAt: start.toISOString(), endAt: end.toISOString(), localStart: localParts(start, settings.timezone).label, localEnd: localParts(end, settings.timezone).label });
    }
  }
  return slots;
}

function originGuard(config: ApiConfig, request: Request): void {
  const origin = request.headers.origin;
  if (origin !== config.allowedOrigin) throw new ApiFailure(403, 'FORBIDDEN', 'Origin is not allowed');
}

function errorMiddleware(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof ApiFailure) {
    response.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } });
    return;
  }
  if (error instanceof z.ZodError) {
    const fields = Object.fromEntries(error.issues.map((issue) => [issue.path.join('.') || 'request', issue.message]));
    response.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', fields } });
    return;
  }
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}

/** Registers the complete public, authentication, and protected admin API. */
export function registerApiRoutes(app: Express, dependencies: ApiDependencies): void {
  const { database, config } = dependencies;
  const now = dependencies.now ?? (() => new Date());
  const authenticate = (request: Request, _response: Response, next: NextFunction) => {
    const token = cookies(request).barbershop_session;
    const session = token ? database.prepare('SELECT admin_id, username, expires_at FROM admin_sessions WHERE token_hash = ?').get(sessionHash(token)) as { admin_id: string; username: string; expires_at: string } | undefined : undefined;
    if (!session || Date.parse(session.expires_at) <= now().getTime()) return next(new ApiFailure(401, 'UNAUTHENTICATED', 'Authentication required'));
    responseLocals(request, session);
    next();
  };

  app.get('/api/shop', (_request, response) => {
    const settings = shop(database);
    const hours = database.prepare('SELECT weekday, start_minute, end_minute FROM shop_hours ORDER BY weekday, start_minute').all() as Array<{ weekday: number; start_minute: number; end_minute: number }>;
    response.json({ data: { name: settings.name, timezone: settings.timezone, currency: settings.currency, weeklyHours: hours.map((h) => ({ weekday: h.weekday, startLocalTime: minuteLabel(h.start_minute), endLocalTime: minuteLabel(h.end_minute) })) } });
  });
  app.get('/api/services', (_request, response) => {
    const rows = database.prepare('SELECT * FROM services WHERE active = 1 ORDER BY display_order, id').all() as ServiceRow[];
    response.json({ data: { services: rows.map((row) => ({ id: row.id, name: row.name, description: row.description, durationMinutes: row.duration_minutes, priceMinor: row.price_amount, currency: row.currency })) } });
  });
  app.get('/api/barbers', (request, response) => {
    if (typeof request.query.serviceId === 'string') service(database, request.query.serviceId);
    const rows = database.prepare('SELECT id, name, bio FROM barbers WHERE active = 1 ORDER BY display_order, id').all() as BarberRow[];
    response.json({ data: { barbers: rows } });
  });
  app.get('/api/availability', (request, response) => {
    if (!z.iso.date().safeParse(request.query.date).success) throw new ApiFailure(422, 'INVALID_DATE', 'A valid calendar date is required');
    const query = querySchema.parse(request.query);
    const serviceRow = service(database, query.serviceId);
    const barberRow = barber(database, query.barberId);
    const settings = shop(database);
    response.json({ data: { date: query.date, timezone: settings.timezone, serviceId: serviceRow.id, barberId: barberRow.id, durationMinutes: serviceRow.duration_minutes, slots: offeredSlots(database, serviceRow, barberRow, query.date, now()) } });
  });
  app.post('/api/appointments', (request, response) => {
    const body = bookingSchema.parse(request.body);
    const create = database.transaction(() => {
      const serviceRow = service(database, body.serviceId);
      const barberRow = barber(database, body.barberId);
      const start = new Date(body.startAt);
      if (start.getTime() <= now().getTime()) throw new ApiFailure(422, 'PAST_SLOT', 'Appointment must be in the future');
      const settings = shop(database);
      const date = localParts(start, settings.timezone).date;
      const local = localParts(start, settings.timezone);
      if (start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0 || localCandidates(date, local.minute, settings.timezone).length !== 1) throw new ApiFailure(422, 'INVALID_TIME', 'Invalid local appointment time');
      const intervals = database.prepare(`SELECT MAX(b.start_minute,s.start_minute) start_minute, MIN(b.end_minute,s.end_minute) end_minute FROM barber_hours b JOIN shop_hours s ON s.weekday=b.weekday WHERE b.barber_id=? AND b.weekday=?`).all(barberRow.id, local.weekday) as Array<{ start_minute: number; end_minute: number }>;
      const interval = intervals.find((item) => local.minute >= item.start_minute && local.minute + serviceRow.duration_minutes <= item.end_minute);
      if (!interval) throw new ApiFailure(422, 'OUTSIDE_WORKING_HOURS', 'Appointment must fit working hours');
      if ((local.minute - interval.start_minute) % settings.slot_interval_minutes !== 0) throw new ApiFailure(422, 'INVALID_TIME', 'Appointment must align with a slot');
      const valid = offeredSlots(database, serviceRow, barberRow, date, now(), true).find((item) => item.startAt === start.toISOString());
      if (!valid) throw new ApiFailure(422, 'INVALID_TIME', 'Appointment time is not bookable');
      const slot = offeredSlots(database, serviceRow, barberRow, date, now()).find((item) => item.startAt === start.toISOString());
      if (!slot) throw new ApiFailure(409, 'SLOT_UNAVAILABLE', 'The selected slot is no longer available');
      const timestamp = now().toISOString();
      const normalizedEmail = body.customer.email?.trim().toLowerCase() ?? null;
      let customer = normalizedEmail ? database.prepare('SELECT id FROM customers WHERE normalized_email = ?').get(normalizedEmail) as { id: string } | undefined : undefined;
      const customerId = customer?.id ?? randomUUID();
      if (!customer) database.prepare('INSERT INTO customers (id,name,email,normalized_email,phone,created_at) VALUES (?,?,?,?,?,?)').run(customerId, body.customer.name, normalizedEmail, normalizedEmail, body.customer.phone, timestamp);
      const id = randomUUID();
      database.prepare(`INSERT INTO appointments (id,customer_id,barber_id,service_id,start_at,end_at,service_name,barber_name,duration_minutes,price_amount,currency,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,'PENDING',?,?)`).run(id, customerId, barberRow.id, serviceRow.id, slot.startAt, slot.endAt, serviceRow.name, barberRow.name, serviceRow.duration_minutes, serviceRow.price_amount, serviceRow.currency, timestamp, timestamp);
      return { id, status: 'PENDING' as const, service: { id: serviceRow.id, name: serviceRow.name, durationMinutes: serviceRow.duration_minutes, priceMinor: serviceRow.price_amount, currency: serviceRow.currency }, barber: { id: barberRow.id, name: barberRow.name }, ...slot, timezone: settings.timezone };
    });
    response.status(201).json({ data: { appointment: create.immediate() } });
  });
  app.post('/api/auth/login', (request, response) => {
    originGuard(config, request);
    const body = loginSchema.parse(request.body);
    if (!equalSecret(body.username, config.adminUsername) || !equalSecret(body.password, config.adminPassword)) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Invalid credentials');
    const token = randomBytes(32).toString('base64url');
    database.prepare('INSERT INTO admin_sessions (token_hash,admin_id,username,expires_at) VALUES (?,?,?,?)').run(sessionHash(token), 'admin-local', config.adminUsername, new Date(now().getTime() + 8 * 60 * 60_000).toISOString());
    response.cookie('barbershop_session', token, { httpOnly: true, sameSite: 'lax', secure: config.secureCookies, maxAge: 8 * 60 * 60_000 }).status(204).send();
  });
  app.post('/api/auth/logout', (request, response) => {
    originGuard(config, request);
    const token = cookies(request).barbershop_session;
    if (token) database.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sessionHash(token));
    response.clearCookie('barbershop_session').status(204).send();
  });
  app.get('/api/auth/session', authenticate, (request, response) => response.json({ data: { admin: { ...requestAdmin(request), role: 'ADMIN' } } }));
  app.get('/api/admin/appointments', authenticate, (request, response) => {
    const query = adminQuerySchema.parse(request.query);
    const rows = database.prepare(`SELECT a.*, c.name customer_name, c.phone customer_phone, c.email customer_email FROM appointments a JOIN customers c ON c.id=a.customer_id
      WHERE (? IS NULL OR a.status = ?) AND (? IS NULL OR a.barber_id = ?) ORDER BY a.start_at, a.id`).all(query.status ?? null, query.status ?? null, query.barberId ?? null, query.barberId ?? null) as Array<Record<string, string | number | null>>;
    const timezone = shop(database).timezone;
    const filtered = query.date ? rows.filter((row) => localParts(new Date(String(row.start_at)), timezone).date === query.date) : rows;
    const offset = (query.page - 1) * query.pageSize;
    const appointments = filtered.slice(offset, offset + query.pageSize).map((row) => ({
      id: row.id, status: row.status,
      customer: { id: row.customer_id, name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
      service: { id: row.service_id, name: row.service_name, durationMinutes: row.duration_minutes, priceMinor: row.price_amount, currency: row.currency },
      barber: { id: row.barber_id, name: row.barber_name },
      startAt: row.start_at, endAt: row.end_at,
      localStart: localParts(new Date(String(row.start_at)), timezone).label,
      localEnd: localParts(new Date(String(row.end_at)), timezone).label,
      createdAt: row.created_at,
    }));
    response.json({ data: { appointments, pagination: { page: query.page, pageSize: query.pageSize, total: filtered.length, totalPages: Math.ceil(filtered.length / query.pageSize) }, timezone } });
  });
  app.patch('/api/admin/appointments/:appointmentId/status', authenticate, (request, response) => {
    originGuard(config, request);
    const body = statusSchema.parse(request.body);
    const transition = database.transaction(() => {
    const current = database.prepare('SELECT status FROM appointments WHERE id = ?').get(request.params.appointmentId) as { status: Status } | undefined;
    if (!current) throw new ApiFailure(404, 'APPOINTMENT_NOT_FOUND', 'Appointment was not found');
    if (current.status !== 'PENDING' && current.status !== body.status) throw new ApiFailure(409, 'INVALID_STATUS_TRANSITION', 'Status transition is not allowed');
    if (current.status === body.status) return;
    const timestamp = now().toISOString();
    database.prepare(`UPDATE appointments SET status=?, updated_at=?, cancelled_at=?, completed_at=? WHERE id=?`).run(body.status, timestamp, body.status === 'CANCELLED' ? timestamp : null, body.status === 'COMPLETED' ? timestamp : null, request.params.appointmentId);
    });
    transition.immediate();
    response.json({ data: { appointment: { id: request.params.appointmentId, status: body.status } } });
  });
  app.use(errorMiddleware);
}

const adminState = new WeakMap<Request, { id: string; username: string }>();
function responseLocals(request: Request, session: { admin_id: string; username: string }): void { adminState.set(request, { id: session.admin_id, username: session.username }); }
function requestAdmin(request: Request) { return adminState.get(request) ?? { id: '', username: '' }; }
function minuteLabel(minute: number): string { return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`; }
