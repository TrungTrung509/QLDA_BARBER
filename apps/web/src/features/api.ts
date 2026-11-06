/** Canonical machine-readable API error returned by the server. */
export type ApiFailure = {
  readonly code: string;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}

/** Error thrown for a non-successful API response. */
export class ApiRequestError extends Error {
  public constructor(
    public readonly status: number,
    public readonly failure: ApiFailure,
  ) {
    super(failure.message);
    this.name = 'ApiRequestError';
  }
}

export type Shop = {
  readonly name: string;
  readonly timezone: string;
  readonly currency: string;
}

export type Service = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly durationMinutes: number;
  readonly priceMinor: number;
  readonly currency: string;
}

export type Barber = {
  readonly id: string;
  readonly name: string;
  readonly bio: string | null;
}

export type Slot = {
  readonly startAt: string;
  readonly endAt: string;
  readonly localStart: string;
  readonly localEnd: string;
}

export type AppointmentSummary = {
  readonly id: string;
  readonly status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  readonly service: Service;
  readonly barber: Pick<Barber, 'id' | 'name'>;
  readonly startAt: string;
  readonly endAt: string;
  readonly timezone?: string;
  readonly localStart: string;
  readonly localEnd: string;
}

export type AdminAppointment = {
  readonly customer: {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly createdAt: string;
} & AppointmentSummary

const configuredOrigin = import.meta.env.VITE_API_URL as string | undefined;
const apiOrigin = configuredOrigin?.replace(/\/$/, '') ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiOrigin}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: ApiFailure }
      | null;
    throw new ApiRequestError(response.status, body?.error ?? {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  }

  if (response.status === 204) return undefined as T;
  const body = (await response.json()) as { data: T };
  return body.data;
}

/** Typed API client for public booking and authenticated management operations. */
export const api = {
  shop: (): Promise<Shop> => request('/api/shop'),
  services: async (): Promise<readonly Service[]> =>
    (await request<{ services: Service[] }>('/api/services')).services,
  barbers: async (serviceId: string): Promise<readonly Barber[]> =>
    (await request<{ barbers: Barber[] }>(`/api/barbers?serviceId=${encodeURIComponent(serviceId)}`)).barbers,
  availability: async (serviceId: string, barberId: string, date: string): Promise<{
    readonly timezone: string;
    readonly slots: readonly Slot[];
  }> => request(`/api/availability?${new URLSearchParams({ serviceId, barberId, date })}`),
  createAppointment: async (body: {
    readonly serviceId: string;
    readonly barberId: string;
    readonly startAt: string;
    readonly customer: { readonly name: string; readonly phone: string; readonly email?: string };
  }): Promise<AppointmentSummary> =>
    (await request<{ appointment: AppointmentSummary }>('/api/appointments', {
      method: 'POST', body: JSON.stringify(body),
    })).appointment,
  session: (): Promise<{ admin: { id: string; username: string; role: string } }> => request('/api/auth/session'),
  login: (username: string, password: string): Promise<void> => request('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  logout: (): Promise<void> => request('/api/auth/logout', { method: 'POST' }),
  appointments: async (filters: { status?: string; date?: string; barberId?: string }): Promise<readonly AdminAppointment[]> => {
    const query = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])));
    return (await request<{ appointments: AdminAppointment[] }>(`/api/admin/appointments?${query}`)).appointments;
  },
  updateStatus: (id: string, status: 'COMPLETED' | 'CANCELLED'): Promise<AdminAppointment> =>
    request(`/api/admin/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
};

/** Formats minor currency units without assuming a particular currency precision. */
export function formatMoney(priceMinor: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(priceMinor / 100);
}

/** Formats a server-provided offset timestamp without using the browser timezone. */
export function formatLocalTime(localInstant: string): string {
  const time = (/T(\d{2}):(\d{2})/.exec(localInstant))?.slice(1);
  if (!time) return localInstant;
  const [hourText, minute] = time;
  if (hourText === undefined || minute === undefined) return localInstant;
  const hour = Number(hourText);
  return `${String(hour % 12 || 12)}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}
