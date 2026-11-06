import { useEffect, useRef, useState } from 'react';
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
  const listRequest = useRef(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    let active = true;
    api.session().then(() => { if (active) setAuthenticated(true); }).catch((reason: unknown) => {
      if (!active) return;
      setAuthenticated(false);
      if (!(reason instanceof ApiRequestError && reason.status === 401)) setError('We could not check your session. Please sign in again.');
    });
    return () => { active = false; listRequest.current += 1; };
  }, []);
  useEffect(() => { if (authenticated) void loadAppointments(); }, [authenticated, filters.status, filters.date, filters.barberId, page]);

  async function loadAppointments(): Promise<void> {
    const requestId = ++listRequest.current;
    setLoading(true); setError('');
    try {
      const result = await api.appointments({ ...filters, page: String(page) });
      if (requestId !== listRequest.current) return;
      const next = result.appointments;
      setAppointments(next); setTotalPages(Math.max(1, result.pagination.totalPages));
      setBarberOptions((current) => {
        const options = new Map(current.map((barber) => [barber.id, barber]));
        next.forEach((appointment) => options.set(appointment.barber.id, appointment.barber));
        return [...options.values()];
      });
    }
    catch (reason) { if (requestId !== listRequest.current) return; if (reason instanceof ApiRequestError && reason.status === 401) { setAuthenticated(false); setAppointments([]); } else { setAppointments([]); setError('We could not load appointments. Please try again.'); } }
    finally { if (requestId === listRequest.current) setLoading(false); }
  }

  async function login(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setLoading(true); setError('');
    try { await api.login(credentials.username.trim(), credentials.password); setCredentials({ username: '', password: '' }); setAuthenticated(true); }
    catch (reason) { setError(reason instanceof ApiRequestError && reason.status === 401 ? 'The username or password is not valid.' : 'Sign in could not be completed. Please try again.'); }
    finally { setLoading(false); }
  }

  async function update(appointment: AdminAppointment, status: 'COMPLETED' | 'CANCELLED'): Promise<void> {
    if (status === 'CANCELLED' && !window.confirm(`Cancel appointment ${appointment.id}?`)) return;
    setUpdating(appointment.id); setError('');
    try { const next = await api.updateStatus(appointment.id, status); setAppointments((items) => items.filter((item) => item.id !== next.id || !filters.status || next.status === filters.status).map((item) => item.id === next.id ? next : item)); }
    catch (reason) { if (reason instanceof ApiRequestError && reason.status === 401) setAuthenticated(false); else setError('Status was not changed. Please try again.'); }
    finally { setUpdating(''); }
  }

  async function logout(): Promise<void> {
    setLoggingOut(true); setError('');
    try {
      await api.logout(); listRequest.current += 1; setAppointments([]); setBarberOptions([]);
      setFilters({ status: '', date: '', barberId: '' }); setPage(1); setAuthenticated(false);
    } catch { setError('Sign out failed. Please try again.'); }
    finally { setLoggingOut(false); }
  }

  if (authenticated === null) return <p role="status">Checking your session…</p>;
  if (!authenticated) return <section className="login-panel"><h1>Management sign in</h1>{error && <div className="notice error" role="alert">{error}</div>}<form onSubmit={(event) => void login(event)}><label className="field">Username<input required autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label><label className="field">Password<input required type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label><button disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></section>;

  return <section className="dashboard"><header className="dashboard-header"><h1>Appointments</h1><button className="secondary" disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? 'Signing out…' : 'Sign out'}</button></header>{error && <div className="notice error" role="alert">{error}</div>}<div className="filters"><label className="field">Date<input type="date" value={filters.date} onChange={(event) => { setPage(1); setFilters({ ...filters, date: event.target.value }); }} /></label><label className="field">Status<select value={filters.status} onChange={(event) => { setPage(1); setFilters({ ...filters, status: event.target.value }); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label><label className="field">Barber<select value={filters.barberId} onChange={(event) => { setPage(1); setFilters({ ...filters, barberId: event.target.value }); }}><option value="">All barbers</option>{barberOptions.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label><button className="secondary" onClick={() => { setPage(1); setFilters({ status: '', date: '', barberId: '' }); }}>Clear filters</button></div>
    {loading ? <p role="status">Loading appointments…</p> : error && appointments.length === 0 ? <button onClick={() => void loadAppointments()}>Retry appointments</button> : appointments.length === 0 ? <p>{Object.values(filters).some(Boolean) ? 'No appointments match these filters.' : 'No appointments yet.'}</p> : <div className="appointment-list">{appointments.map((appointment) => <article className="appointment-card" key={appointment.id}><div><h2>{appointment.localStart.slice(0, 10)} · {formatLocalTime(appointment.localStart)} · {appointment.customer.name}</h2><p>{appointment.service.name} with {appointment.barber.name}</p><p>{appointment.customer.phone}{appointment.customer.email ? ` · ${appointment.customer.email}` : ''}</p><p>{formatMoney(appointment.service.priceMinor, appointment.service.currency)} · Reference {appointment.id}</p></div><div><span className={`badge ${appointment.status.toLowerCase()}`}>{appointment.status}</span>{appointment.status === 'PENDING' && <div className="actions"><button disabled={Boolean(updating) || loggingOut} onClick={() => void update(appointment, 'COMPLETED')}>Mark completed</button><button className="secondary" disabled={Boolean(updating) || loggingOut} onClick={() => void update(appointment, 'CANCELLED')}>Cancel appointment</button></div>}</div></article>)}</div>}
    {totalPages > 1 && <nav aria-label="Appointment pages"><button disabled={loading || page === 1} onClick={() => setPage((value) => value - 1)}>Previous page</button><span>Page {page} of {totalPages}</span><button disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next page</button></nav>}
  </section>;
}
