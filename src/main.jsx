import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import React from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ChatProvider } from './contexts/ChatContext.jsx'
import { WebSocketProvider } from './contexts/WebSocketContext.jsx'


import { AuthProviderLogin } from './contexts/AuthContext.jsx'
import { InternetIdentityProvider } from './contexts/InternetIdentityContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Telegram analytics - disabled in development to prevent errors
console.log('🌐 Running in browser/development mode - Telegram analytics disabled');

// Debug app initialization
console.log('🚀 Main.jsx starting...');
console.log('🚀 React version:', React.version);

// Add error handler for uncaught errors
window.addEventListener('error', (error) => {
  console.error('🚨 Global error caught:', error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});


console.log('🚀 About to render app...');

try {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HeroUIProvider>
          <TonConnectUIProvider manifestUrl="https://app.olivianetwork.com/tonconnect-manifest.json">
            <BrowserRouter 
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <AuthProviderLogin>
                <InternetIdentityProvider>
                  <WebSocketProvider>
                  <ChatProvider>
                      <main className="dark text-foreground bg-background">
                          <App />
                      </main>
                  </ChatProvider>
                  </WebSocketProvider>
                </InternetIdentityProvider>
              </AuthProviderLogin>
            </BrowserRouter>
          </TonConnectUIProvider>
        </HeroUIProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('🚀 App render completed successfully!');
} catch (error) {
  console.error('🚨 Critical error during app render:', error);
  
  // Fallback render
  createRoot(document.getElementById('root')).render(
    <div style={{ padding: '20px', background: 'red', color: 'white' }}>
      <h1>Critical Error</h1>
      <p>Failed to initialize app: {error.message}</p>
      <button onClick={() => window.location.reload()}>Refresh Page</button>
    </div>
  );
}
