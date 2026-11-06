/** Canonical machine-readable API error returned by the server. */
export interface ApiFailure {
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

export interface Shop {
  readonly name: string;
  readonly timezone: string;
  readonly currency: string;
}

export interface Service {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly durationMinutes: number;
  readonly priceMinor: number;
  readonly currency: string;
}

export interface Barber {
  readonly id: string;
  readonly name: string;
  readonly bio: string | null;
}

export interface Slot {
  readonly startAt: string;
  readonly endAt: string;
  readonly localStart: string;
  readonly localEnd: string;
}

export interface AppointmentSummary {
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

export interface AdminAppointment extends AppointmentSummary {
  readonly customer: {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly createdAt: string;
}

const configuredOrigin = import.meta.env.VITE_API_URL as string | undefined;
const apiOrigin = configuredOrigin?.replace(/\/$/, '').replace(/\/api$/, '') ?? '';

async function request<T>(path: string, init?: RequestInit, expectedStatus?: number): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`, {
    credentials: 'include',
    ...init,
    ...(init?.body
      ? { headers: { 'Content-Type': 'application/json', ...init.headers } }
      : init?.headers ? { headers: init.headers } : {}),
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

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    throw new ApiRequestError(response.status, { code: 'INVALID_RESPONSE', message: 'The server did not confirm this operation. Please try again.' });
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
    }, 201)).appointment,
  session: (): Promise<{ admin: { id: string; username: string; role: string } }> => request('/api/auth/session'),
  login: (username: string, password: string): Promise<void> => request('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  logout: (): Promise<void> => request('/api/auth/logout', { method: 'POST' }),
  appointments: async (filters: { status?: string; date?: string; barberId?: string; page?: string }): Promise<{ appointments: readonly AdminAppointment[]; pagination: { page: number; totalPages: number; total: number }; timezone: string }> => {
    const query = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])));
    return request(`/api/admin/appointments?${query}`);
  },
  updateStatus: (id: string, status: 'COMPLETED' | 'CANCELLED'): Promise<AdminAppointment> =>
    request(`/api/admin/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
};

/** Formats minor currency units without assuming a particular currency precision. */
export function formatMoney(priceMinor: number, currency: string): string {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(priceMinor / 10 ** digits);
}

/** Formats a server-provided offset timestamp without using the browser timezone. */
export function formatLocalTime(localInstant: string): string {
  const time = localInstant.match(/T(\d{2}):(\d{2})/)?.slice(1);
  if (!time) return localInstant;
  const [hourText, minute] = time;
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}
