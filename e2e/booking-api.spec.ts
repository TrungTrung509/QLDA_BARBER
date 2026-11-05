import { expect, test, type APIRequestContext } from '@playwright/test';
import fixture from './fixtures/booking.json' with { type: 'json' };

const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';

interface BookingInput {
  readonly serviceId: string;
  readonly barberId: string;
  readonly startAt: string;
  readonly customer: typeof fixture.customer;
}

async function createBooking(request: APIRequestContext, input: BookingInput) {
  return request.post(`${apiUrl}/appointments`, { data: input });
}

test.describe('booking API capacity and validation', () => {
  test('atomically allows exactly one concurrent overlapping booking for one barber', async ({ request }) => {
    const input: BookingInput = {
      serviceId: fixture.services.haircut30.id,
      barberId: fixture.barbers.alex.id,
      startAt: fixture.intervals.existing.start,
      customer: fixture.customer,
    };

    const [first, second] = await Promise.all([
      createBooking(request, input),
      createBooking(request, { ...input, customer: { ...fixture.customer, email: 'second@example.test' } }),
    ]);
    expect([first.status(), second.status()].sort()).toEqual([201, 409]);
    const conflict = first.status() === 409 ? first : second;
    await expect(conflict.json()).resolves.toMatchObject({ error: { code: 'SLOT_UNAVAILABLE' } });
  });

  test('allows the same slot for different barbers', async ({ request }) => {
    const common = {
      serviceId: fixture.services.haircut30.id,
      startAt: '2030-06-11T14:00:00.000Z',
      customer: fixture.customer,
    };
    const responses = await Promise.all([
      createBooking(request, { ...common, barberId: fixture.barbers.alex.id }),
      createBooking(request, {
        ...common,
        barberId: fixture.barbers.sam.id,
        customer: { ...fixture.customer, email: 'sam-slot@example.test' },
      }),
    ]);
    expect(responses.map((response) => response.status())).toEqual([201, 201]);
  });

  test('uses half-open duration boundaries and rejects a true overlap', async ({ request }) => {
    const longBooking = await createBooking(request, {
      serviceId: fixture.services.cutAndBeard60.id,
      barberId: fixture.barbers.alex.id,
      startAt: '2030-06-12T14:00:00.000Z',
      customer: fixture.customer,
    });
    expect(longBooking.status()).toBe(201);

    const overlap = await createBooking(request, {
      serviceId: fixture.services.haircut30.id,
      barberId: fixture.barbers.alex.id,
      startAt: '2030-06-12T14:30:00.000Z',
      customer: { ...fixture.customer, email: 'overlap@example.test' },
    });
    expect(overlap.status()).toBe(409);

    const touching = await createBooking(request, {
      serviceId: fixture.services.haircut30.id,
      barberId: fixture.barbers.alex.id,
      startAt: '2030-06-12T15:00:00.000Z',
      customer: { ...fixture.customer, email: 'touching@example.test' },
    });
    expect(touching.status()).toBe(201);
  });

  test('makes a cancelled appointment slot reusable', async ({ request }) => {
    const username = process.env.E2E_ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!username || !password, 'E2E admin credentials are required');
    const login = await request.post(`${apiUrl}/auth/login`, { data: { username, password } });
    expect(login.status()).toBe(204);

    const created = await createBooking(request, {
      serviceId: fixture.services.haircut30.id,
      barberId: fixture.barbers.alex.id,
      startAt: '2030-06-15T14:00:00.000Z',
      customer: fixture.customer,
    });
    expect(created.status()).toBe(201);
    const createdBody = (await created.json()) as { readonly data: { readonly appointment: { readonly id: string } } };
    const appointment = createdBody.data.appointment;

    const cancelled = await request.patch(`${apiUrl}/admin/appointments/${appointment.id}/status`, {
      data: { status: 'Cancelled' },
    });
    expect(cancelled.ok()).toBe(true);

    const reused = await createBooking(request, {
      serviceId: fixture.services.haircut30.id,
      barberId: fixture.barbers.alex.id,
      startAt: '2030-06-15T14:00:00.000Z',
      customer: { ...fixture.customer, email: 'reused@example.test' },
    });
    expect(reused.status()).toBe(201);
  });

  for (const invalid of [
    { label: 'past instant', startAt: '2020-01-01T15:00:00.000Z', serviceId: fixture.services.haircut30.id, barberId: fixture.barbers.alex.id },
    { label: 'outside hours', startAt: '2030-06-13T08:00:00.000Z', serviceId: fixture.services.haircut30.id, barberId: fixture.barbers.alex.id },
    { label: 'inactive service', startAt: '2030-06-13T14:00:00.000Z', serviceId: fixture.services.inactive.id, barberId: fixture.barbers.alex.id },
    { label: 'inactive barber', startAt: '2030-06-13T14:00:00.000Z', serviceId: fixture.services.haircut30.id, barberId: fixture.barbers.inactive.id },
    { label: 'malformed instant', startAt: 'not-an-instant', serviceId: fixture.services.haircut30.id, barberId: fixture.barbers.alex.id },
  ]) {
    test(`rejects ${invalid.label}`, async ({ request }) => {
      const response = await createBooking(request, { ...invalid, customer: fixture.customer });
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  }

  test('excludes nonexistent DST time and disambiguates repeated local labels by offset', async ({ request }) => {
    test.skip(process.env.E2E_SHOP_TIMEZONE !== 'America/New_York', 'Requires a DST-observing shop fixture');
    const nonexistent = await request.get(`${apiUrl}/availability`, {
      params: {
        serviceId: fixture.services.haircut30.id,
        barberId: fixture.barbers.alex.id,
        date: fixture.dst.nonexistentDate,
      },
    });
    expect(nonexistent.status()).toBe(200);
    const nonexistentBody = (await nonexistent.json()) as {
      readonly data: { readonly slots: ReadonlyArray<{ readonly localStart: string }> };
    };
    expect(nonexistentBody.data.slots.some((slot) =>
      slot.localStart.includes(`T${fixture.dst.nonexistentLocalTime}`))).toBe(false);

    const ambiguous = await request.get(`${apiUrl}/availability`, {
      params: {
        serviceId: fixture.services.haircut30.id,
        barberId: fixture.barbers.alex.id,
        date: fixture.dst.ambiguousDate,
      },
    });
    expect(ambiguous.status()).toBe(200);
    const ambiguousBody = (await ambiguous.json()) as {
      readonly data: { readonly slots: ReadonlyArray<{ readonly localStart: string }> };
    };
    const repeatedLabels = ambiguousBody.data.slots
      .filter((slot) => slot.localStart.includes(`T${fixture.dst.ambiguousLocalTime}`))
      .map((slot) => slot.localStart);
    expect(new Set(repeatedLabels).size).toBe(repeatedLabels.length);
  });
});

