import { useEffect, useRef, useState } from 'react';
import type React from 'react';

import { ApiRequestError, api, formatLocalTime, formatMoney } from '../features/api';
import type { AppointmentSummary, Barber, Service, Shop, Slot } from '../features/api';

type Step = 'service' | 'barber' | 'date' | 'time' | 'details' | 'confirmed';

/** Public landing, service catalogue, and API-backed appointment booking flow. */
export function PublicBookingPage(): React.JSX.Element {
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<readonly Service[]>([]);
  const [barbers, setBarbers] = useState<readonly Barber[]>([]);
  const [slots, setSlots] = useState<readonly Slot[]>([]);
  const [step, setStep] = useState<Step>('service');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState('');
  const [startAt, setStartAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState('');
  const [confirmation, setConfirmation] = useState<AppointmentSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const stepHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    Promise.all([api.shop(), api.services()])
      .then(([nextShop, nextServices]) => { setShop(nextShop); setServices(nextServices); })
      .catch(() => { setError('We could not load services. Please try again.'); })
      .finally(() => { setLoading(false); });
  }, []);

  function move(next: Step): void {
    setError(''); setConflict(''); setStep(next);
    window.setTimeout(() => stepHeading.current?.focus(), 0);
  }

  async function chooseService(id: string): Promise<void> {
    setServiceId(id); setBarberId(''); setDate(''); setStartAt(''); setLoading(true); setError('');
    try { setBarbers(await api.barbers(id)); move('barber'); }
    catch { setError('We could not load barbers. Please try again.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (step !== 'time' || !serviceId || !barberId || !date) return;
    const controller = new AbortController();
    const isActive = (): boolean => !controller.signal.aborted;
    void Promise.resolve().then(async () => {
      if (!isActive()) return;
      setLoading(true); setError('');
      try {
        const result = await api.availability(serviceId, barberId, date);
        if (isActive()) setSlots(result.slots);
      } catch { if (isActive()) setError('We could not load available times. Please try again.'); }
      finally { if (isActive()) setLoading(false); }
    });
    return () => { controller.abort(); };
  }, [step, serviceId, barberId, date]);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const appointment = await api.createAppointment({ serviceId, barberId, startAt, customer: {
        name: customer.name.trim(), phone: customer.phone.trim(), ...(customer.email.trim() ? { email: customer.email.trim() } : {}),
      } });
      setConfirmation(appointment); move('confirmed');
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.failure.code === 'SLOT_UNAVAILABLE') {
        setStartAt('');
        setError('');
        setStep('time');
        setConflict('That time was just booked. Choose another available time.');
        window.setTimeout(() => stepHeading.current?.focus(), 0);
      } else if (reason instanceof ApiRequestError && reason.failure.fields) {
        setError(Object.values(reason.failure.fields)[0] ?? reason.failure.message);
      } else setError('We could not create your booking. Please try again.');
    } finally { setSubmitting(false); }
  }

  const selectedService = services.find((item) => item.id === serviceId);
  const selectedBarber = barbers.find((item) => item.id === barberId);

  return <>
    <section className="hero"><div><p className="eyebrow">Independent craft. Easy booking.</p><h1>{shop?.name ?? 'Barbershop Booking'}</h1><p>A sharp cut, on your schedule. Choose a live available time in a few steps.</p><a className="button" href="#booking">Book an appointment</a></div><div className="hero-mark" aria-hidden="true">B</div></section>
    <section className="section" aria-labelledby="prices-heading"><h2 id="prices-heading">Services &amp; prices</h2>{loading && !services.length ? <p role="status">Loading services…</p> : error && !services.length ? <div className="notice error" role="alert">{error}</div> : services.length === 0 ? <p>No services are currently bookable.</p> : <div className="service-grid">{services.map((service) => <article className="card" key={service.id}><h3>{service.name}</h3><p>{service.description}</p><p>{service.durationMinutes} minutes · <strong>{formatMoney(service.priceMinor, service.currency)}</strong></p><button onClick={() => void chooseService(service.id)}>Choose {service.name}</button></article>)}</div>}</section>
    <section id="booking" className="booking-panel" aria-labelledby="step-heading"><p className="progress">{step === 'confirmed' ? 'Booking complete' : `Booking: ${step}`}</p><h2 id="step-heading" ref={stepHeading} tabIndex={-1}>{step === 'service' ? 'Choose a service' : step === 'barber' ? 'Choose a barber' : step === 'date' ? 'Choose a date' : step === 'time' ? 'Choose an available time' : step === 'details' ? 'Your details' : 'You’re booked'}</h2>
      {error && (services.length > 0 || step !== 'service') && <div className="notice error" role="alert">{error}</div>}{conflict && <div className="notice warning" role="alert">{conflict}</div>}
      {step === 'service' && <div className="options">{services.map((service) => <button className="option" key={service.id} onClick={() => void chooseService(service.id)}>{service.name} · {formatMoney(service.priceMinor, service.currency)}</button>)}</div>}
      {step === 'barber' && (loading ? <p role="status">Loading barbers…</p> : barbers.length === 0 ? <><p>No barbers are available for that service.</p><button onClick={() => { move('service'); }}>Choose another service</button></> : <fieldset><legend>Available barbers</legend><div className="options">{barbers.map((barber) => <label className="option" key={barber.id}><input type="radio" name="barber" checked={barberId === barber.id} onChange={() => { setBarberId(barber.id); setDate(''); setStartAt(''); }} />{barber.name}</label>)}</div><button disabled={!barberId} onClick={() => { move('date'); }}>Continue</button></fieldset>)}
      {step === 'date' && <><label className="field">Appointment date<input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => { setDate(event.target.value); setStartAt(''); }} /></label><p>Times shown in {shop?.timezone ?? 'the shop timezone'}.</p><button disabled={!date} onClick={() => { move('time'); }}>Find times</button></>}
      {step === 'time' && (loading ? <p role="status">Loading available times…</p> : slots.length === 0 ? <><p>No times remain for this date.</p><button onClick={() => { move('date'); }}>Choose another date</button></> : <fieldset><legend>Available times for {date}</legend><div className="slot-grid">{slots.map((slot) => <label className="option" key={slot.startAt}><input type="radio" name="slot" checked={startAt === slot.startAt} onChange={() => { setStartAt(slot.startAt); }} />{formatLocalTime(slot.localStart)}</label>)}</div><button disabled={!startAt} onClick={() => { move('details'); }}>Continue</button></fieldset>)}
      {step === 'details' && <form onSubmit={(event) => void submit(event)}><p>{selectedService?.name} with {selectedBarber?.name}</p><label className="field">Full name<input required maxLength={120} autoComplete="name" value={customer.name} onChange={(event) => { setCustomer({ ...customer, name: event.target.value }); }} /></label><label className="field">Phone<input required minLength={5} maxLength={30} autoComplete="tel" value={customer.phone} onChange={(event) => { setCustomer({ ...customer, phone: event.target.value }); }} /></label><label className="field">Email (optional)<input type="email" maxLength={254} autoComplete="email" value={customer.email} onChange={(event) => { setCustomer({ ...customer, email: event.target.value }); }} /></label><button disabled={submitting}>{submitting ? 'Booking…' : 'Confirm booking'}</button></form>}
      {step === 'confirmed' && confirmation && <div className="notice success"><p><strong>Appointment {confirmation.id}</strong> is {confirmation.status.toLowerCase()}.</p><p>{confirmation.service.name} with {confirmation.barber.name}</p><p>{formatLocalTime(confirmation.localStart)}–{formatLocalTime(confirmation.localEnd)} · {confirmation.timezone}</p><p>{confirmation.service.durationMinutes} minutes · {formatMoney(confirmation.service.priceMinor, confirmation.service.currency)}</p></div>}
    </section>
  </>;
}
