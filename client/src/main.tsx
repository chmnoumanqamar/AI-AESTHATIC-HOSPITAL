import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { getStoredThemeColor, applyThemeColor } from './utils/themePalette';

// Boot stored color palette immediately
applyThemeColor(getStoredThemeColor());

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
