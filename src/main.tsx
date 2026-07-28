import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, registerPeriodicSync } from './lib/notifications';

// Purge any residual dark mode class from html element and local storage
document.documentElement.classList.remove('dark');
localStorage.removeItem('neurotask_theme');

// Register Service Worker for background push notifications on Android PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const registration = await registerServiceWorker();
    if (registration) {
      await registerPeriodicSync();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
