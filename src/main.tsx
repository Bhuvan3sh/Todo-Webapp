import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Purge any residual dark mode class from html element and local storage
document.documentElement.classList.remove('dark');
localStorage.removeItem('neurotask_theme');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
