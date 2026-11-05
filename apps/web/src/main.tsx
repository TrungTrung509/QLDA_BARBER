import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

/** Mounts the application when the document provides the expected root element. */
const rootElement = document.querySelector<HTMLElement>('#root');
if (rootElement !== null) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
