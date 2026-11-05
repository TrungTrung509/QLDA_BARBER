// @vitest-environment jsdom
import '../test-setup';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '../features/api';
import { AdminPage } from './AdminPage';

vi.mock('../features/api', async (load) => ({ ...(await load<typeof import('../features/api')>()), api: { session: vi.fn(), login: vi.fn(), logout: vi.fn(), appointments: vi.fn(), updateStatus: vi.fn() } }));
afterEach(cleanup);

describe('admin page', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does not expose appointment data before authentication', async () => {
    vi.mocked(api.session).mockRejectedValue(new Error('unauthorized'));
    render(<AdminPage />);
    expect(await screen.findByRole('heading', { name: 'Management sign in' })).toBeInTheDocument();
    expect(api.appointments).not.toHaveBeenCalled();
  });
  it('loads an authenticated empty state and filters', async () => {
    vi.mocked(api.session).mockResolvedValue({ admin: { id: 'a', username: 'admin', role: 'ADMIN' } });
    vi.mocked(api.appointments).mockResolvedValue([]);
    render(<AdminPage />);
    expect(await screen.findByText('No appointments yet.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'PENDING' } });
    expect(await screen.findByText('No appointments match these filters.')).toBeInTheDocument();
  });
});
