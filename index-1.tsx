import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use relative path './service-worker.js' instead of absolute '/service-worker.js'
    // to ensure it works in preview environments and subdirectories.
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, (err) => {
        console.warn('ServiceWorker registration failed: ', err);
      });
  });
}