import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/entrypoints/sidepanel/App';
import '@/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
