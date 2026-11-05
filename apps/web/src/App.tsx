import type React from 'react';

import { BarbershopApp } from './pages/BarbershopApp';

/** Connects the DOM entry point to the public and management route shell. */
export function App(): React.JSX.Element {
  return <BarbershopApp />;
}
