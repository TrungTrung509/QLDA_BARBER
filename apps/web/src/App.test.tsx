import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('./pages/BarbershopApp', () => ({ BarbershopApp: () => <main>Connected application</main> }));

describe('application shell', () => {
  it('connects the entry shell to the routed application', () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Connected application')).toBeInTheDocument();
  });
});
