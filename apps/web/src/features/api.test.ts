import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, formatLocalTime, formatMoney } from './api';

describe('API client', () => {
  afterEach(() => { vi.restoreAllMocks(); });
  it('unwraps successful responses and includes cookie credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { services: [] } }), { status: 200 }));
    await expect(api.services()).resolves.toEqual([]);
    const origin = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
    expect(fetchMock).toHaveBeenCalledWith(`${origin}/api/services`, expect.objectContaining({ credentials: 'include' }));
    fetchMock.mockRestore();
  });

  it('sends JSON booking payloads with a normalized content type', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(
      JSON.stringify({ data: { appointment: { id: 'booking' } } }), { status: 201 },
    ));
    const booking = { serviceId: 's', barberId: 'b', startAt: 'now', customer: { name: 'A', phone: '12345' } };
    await expect(api.createAppointment(booking)).resolves.toEqual({ id: 'booking' });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify(booking));
    fetchMock.mockRestore();
  });

  it('surfaces stable error codes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'SLOT_UNAVAILABLE', message: 'Taken' } }), { status: 409 }));
    await expect(api.createAppointment({ serviceId: 's', barberId: 'b', startAt: 'now', customer: { name: 'A', phone: '12345' } })).rejects.toMatchObject({ status: 409, failure: { code: 'SLOT_UNAVAILABLE', message: 'Taken' } });
    vi.restoreAllMocks();
  });

  it('formats money and server-local clock values', () => {
    expect(formatMoney(3500, 'USD')).toContain('35');
    expect(formatLocalTime('2026-11-06T13:05:00+07:00')).toBe('1:05 PM');
  });
});
