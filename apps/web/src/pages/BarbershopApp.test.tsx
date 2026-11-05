// @vitest-environment jsdom
import '../test-setup';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '../features/api';
import { BarbershopApp } from './BarbershopApp';

vi.mock('../features/api', async (load) => ({ ...(await load<typeof import('../features/api')>()), api: { shop: vi.fn().mockResolvedValue({ name: 'Shop', timezone: 'UTC', currency: 'USD' }), services: vi.fn().mockResolvedValue([]), session: vi.fn().mockRejectedValue(new Error('unauthorized')) } }));
afterEach(cleanup);

describe('route shell', () => {
  it('provides skip navigation and public landmarks', async () => {
    window.history.replaceState({}, '', '/');
    render(<BarbershopApp />);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(await screen.findByRole('main')).toBeInTheDocument();
  });
  it('protects the admin path with login', async () => {
    window.history.replaceState({}, '', '/admin');
    render(<BarbershopApp />);
    expect(await screen.findByRole('heading', { name: 'Management sign in' })).toBeInTheDocument();
    expect(api.session).toHaveBeenCalled();
  });
});
