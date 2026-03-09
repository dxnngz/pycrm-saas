/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import 'virtual:pwa-register';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
