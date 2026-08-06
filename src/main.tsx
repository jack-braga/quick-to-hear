import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import '@/lib/theme'; // side-effect: apply theme pre-render + attach OS-sync listener
import '@/index.css';

// The service worker is registered by `useRegisterSW` inside <PwaReloadToast> (registerType
// 'prompt'), which also drives the update/offline-ready toast — so no registerSW() here.

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
