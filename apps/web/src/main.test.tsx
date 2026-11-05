import { cleanup, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./App', () => ({ App: () => <main>Mounted application</main> }));

describe('web entry point', () => {
  it('mounts the application into the document root', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main');

    expect(screen.getByText('Mounted application')).toBeInTheDocument();
    cleanup();
  });
});
