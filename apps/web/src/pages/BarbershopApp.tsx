import type React from 'react';

import { AdminPage } from './AdminPage';
import { PublicBookingPage } from './PublicBookingPage';
import '../styles/global.css';

/** Dependency-free route shell for the public and management experiences. */
export function BarbershopApp(): React.JSX.Element {
  const isAdmin = window.location.pathname.startsWith('/admin') || window.location.pathname === '/login';
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><nav aria-label="Primary"><a className="brand" href="/">North &amp; Main</a><a href="/#prices-heading">Services</a><a href="/#booking">Book</a><a href="/admin">Manage</a></nav></header><main id="main">{isAdmin ? <AdminPage /> : <PublicBookingPage />}</main></>;
}
