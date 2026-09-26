import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './i18n'; // Initialize i18n BEFORE rendering
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { setupGlobalStorageErrorHandler } from './utils/storageCleanup.js';

import { AudioProvider } from './context/AudioContext.jsx';

// Initialize global storage quota & unhandled rejection recovery
setupGlobalStorageErrorHandler();

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#fcf9f5] text-stone-700 font-medium">Loading interface...</div>}>
          <AudioProvider>
            <App />
          </AudioProvider>
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
