import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/baloo-2';
import '@fontsource-variable/nunito';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from './App';
import { AuthProvider } from './state/AuthContext';
import { StoreProvider } from './state/Store';
import { ThemeProvider } from './state/Theme';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.onLine) return;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
      }
      const { prepareOfflineContent } = await import('./lib/content');
      void prepareOfflineContent();
    }).catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
