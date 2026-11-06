// @vitest-environment jsdom
import '../test-setup';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError, api } from '../features/api';
import { PublicBookingPage } from './PublicBookingPage';

vi.mock('../features/api', async (load) => ({ ...(await load<typeof import('../features/api')>()), api: { shop: vi.fn(), services: vi.fn(), barbers: vi.fn(), availability: vi.fn(), createAppointment: vi.fn() } }));
const service = { id: 's1', name: 'Cut', description: 'Classic', durationMinutes: 30, priceMinor: 3500, currency: 'USD' };
afterEach(cleanup);

describe('public booking', () => {
  beforeEach(() => { vi.mocked(api.shop).mockResolvedValue({ name: 'North & Main', timezone: 'UTC', currency: 'USD' }); vi.mocked(api.services).mockResolvedValue([service]); });
  it('renders API-backed prices and advances through selection', async () => {
    vi.mocked(api.barbers).mockResolvedValue([{ id: 'b1', name: 'Alex', bio: null }]);
    render(<PublicBookingPage />);
    expect(await screen.findByRole('heading', { name: 'North & Main' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose Cut' }));
    expect(await screen.findByRole('heading', { name: 'Choose a barber' })).toBeInTheDocument();
  });
  it('shows an explicit service loading failure', async () => {
    vi.mocked(api.services).mockRejectedValueOnce(new Error('offline'));
    render(<PublicBookingPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load services');
  });
  it('never renders confirmation before create succeeds', async () => {
    render(<PublicBookingPage />);
    await waitFor(() => { expect(api.services).toHaveBeenCalled(); });
    expect(screen.queryByText(/Appointment .* is pending/)).not.toBeInTheDocument();
  });
  it('refreshes availability after a slot conflict without losing customer details', async () => {
    vi.mocked(api.barbers).mockResolvedValue([{ id: 'b1', name: 'Alex', bio: null }]);
    vi.mocked(api.availability).mockResolvedValue({ timezone: 'UTC', slots: [{ startAt: '2099-01-01T10:00:00.000Z', endAt: '2099-01-01T10:30:00.000Z', localStart: '2099-01-01T10:00:00+00:00', localEnd: '2099-01-01T10:30:00+00:00' }] });
    vi.mocked(api.createAppointment).mockRejectedValue(new ApiRequestError(409, { code: 'SLOT_UNAVAILABLE', message: 'Taken' }));
    render(<PublicBookingPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Choose Cut' }));
    fireEvent.click(await screen.findByLabelText('Alex'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Appointment date'), { target: { value: '2099-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find times' }));
    fireEvent.click(await screen.findByLabelText('10:00 AM'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sam Customer' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '1234567' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('just booked');
    await waitFor(() => { expect(api.availability).toHaveBeenCalledTimes(2); });
    fireEvent.click(await screen.findByLabelText('10:00 AM'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Full name')).toHaveValue('Sam Customer');
  });
});
