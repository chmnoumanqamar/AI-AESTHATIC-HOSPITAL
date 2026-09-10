import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { getStoredWindowFormatting, applyWindowFormatting } from './utils/windowFormatting';

// Boot stored window formatting & typography customizations immediately
applyWindowFormatting(getStoredWindowFormatting());

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
