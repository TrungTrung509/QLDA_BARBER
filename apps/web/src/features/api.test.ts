import { describe, expect, it, vi } from 'vitest';

import { api, formatLocalTime, formatMoney } from './api';

describe('API client', () => {
  it('unwraps successful responses and includes cookie credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { services: [] } }), { status: 200 }));
    await expect(api.services()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/services', expect.objectContaining({ credentials: 'include' }));
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
