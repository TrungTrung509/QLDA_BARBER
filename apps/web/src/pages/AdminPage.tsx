import { useEffect, useState } from 'react';
import type React from 'react';

import { ApiRequestError, api, formatLocalTime, formatMoney } from '../features/api';
import type { AdminAppointment } from '../features/api';

/** Protected login and appointment management experience. */
export function AdminPage(): React.JSX.Element {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<readonly AdminAppointment[]>([]);
  const [barberOptions, setBarberOptions] = useState<readonly { id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: '', date: '', barberId: '' });
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => { api.session().then(() => { setAuthenticated(true); }).catch(() => { setAuthenticated(false); }); }, []);
  useEffect(() => {
    if (!authenticated) return;
    const controller = new AbortController();
    const isActive = (): boolean => !controller.signal.aborted;
    void Promise.resolve().then(async () => {
      if (!isActive()) return;
      setLoading(true); setError('');
      try {
        const next = await api.appointments(filters);
        if (!isActive()) return;
        setAppointments(next);
        setBarberOptions((current) => {
          const options = new Map(current.map((barber) => [barber.id, barber]));
          next.forEach((appointment) => { options.set(appointment.barber.id, appointment.barber); });
          return [...options.values()];
        });
      } catch (reason) {
        if (!isActive()) return;
        if (reason instanceof ApiRequestError && reason.status === 401) setAuthenticated(false);
        else setError('We could not load appointments. Please try again.');
      } finally { if (isActive()) setLoading(false); }
    });
    return () => { controller.abort(); };
  }, [authenticated, filters]);

  async function login(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setLoading(true); setError('');
    try { await api.login(credentials.username, credentials.password); setAuthenticated(true); }
    catch { setError('The username or password is not valid.'); }
    finally { setLoading(false); }
  }

  async function update(appointment: AdminAppointment, status: 'COMPLETED' | 'CANCELLED'): Promise<void> {
    if (status === 'CANCELLED' && !window.confirm(`Cancel appointment ${appointment.id}?`)) return;
    setUpdating(appointment.id); setError('');
    try { const next = await api.updateStatus(appointment.id, status); setAppointments((items) => items.map((item) => item.id === next.id ? next : item)); }
    catch (reason) { if (reason instanceof ApiRequestError && reason.status === 401) setAuthenticated(false); else setError('Status was not changed. Please try again.'); }
    finally { setUpdating(''); }
  }

  if (authenticated === null) return <p role="status">Checking your session…</p>;
  if (!authenticated) return <section className="login-panel"><h1>Management sign in</h1>{error && <div className="notice error" role="alert">{error}</div>}<form onSubmit={(event) => void login(event)}><label className="field">Username<input required autoComplete="username" value={credentials.username} onChange={(event) => { setCredentials({ ...credentials, username: event.target.value }); }} /></label><label className="field">Password<input required type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => { setCredentials({ ...credentials, password: event.target.value }); }} /></label><button disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></section>;

  return <section className="dashboard"><header className="dashboard-header"><h1>Appointments</h1><button className="secondary" onClick={() => void api.logout().then(() => { setAuthenticated(false); })}>Sign out</button></header>{error && <div className="notice error" role="alert">{error}</div>}<div className="filters"><label className="field">Date<input type="date" value={filters.date} onChange={(event) => { setFilters({ ...filters, date: event.target.value }); }} /></label><label className="field">Status<select value={filters.status} onChange={(event) => { setFilters({ ...filters, status: event.target.value }); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label><label className="field">Barber<select value={filters.barberId} onChange={(event) => { setFilters({ ...filters, barberId: event.target.value }); }}><option value="">All barbers</option>{barberOptions.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label><button className="secondary" onClick={() => { setFilters({ status: '', date: '', barberId: '' }); }}>Clear filters</button></div>
    {loading ? <p role="status">Loading appointments…</p> : appointments.length === 0 ? <p>{Object.values(filters).some(Boolean) ? 'No appointments match these filters.' : 'No appointments yet.'}</p> : <div className="appointment-list">{appointments.map((appointment) => <article className="appointment-card" key={appointment.id}><div><h2>{formatLocalTime(appointment.localStart)} · {appointment.customer.name}</h2><p>{appointment.service.name} with {appointment.barber.name}</p><p>{appointment.customer.phone}{appointment.customer.email ? ` · ${appointment.customer.email}` : ''}</p><p>{formatMoney(appointment.service.priceMinor, appointment.service.currency)} · Reference {appointment.id}</p></div><div><span className={`badge ${appointment.status.toLowerCase()}`}>{appointment.status}</span>{appointment.status === 'PENDING' && <div className="actions"><button disabled={updating === appointment.id} onClick={() => void update(appointment, 'COMPLETED')}>Mark completed</button><button className="secondary" disabled={updating === appointment.id} onClick={() => void update(appointment, 'CANCELLED')}>Cancel appointment</button></div>}</div></article>)}</div>}
  </section>;
}
