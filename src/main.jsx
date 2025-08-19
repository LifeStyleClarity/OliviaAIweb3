import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import React from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ChatProvider } from './contexts/ChatContext.jsx'
import { WebSocketProvider } from './contexts/WebSocketContext.jsx'

import ConditionalChatModal from './components/ui/ConditionalChatModal.jsx'
import { AuthProviderLogin } from './contexts/AuthContext.jsx'
import { InternetIdentityProvider } from './contexts/InternetIdentityContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Telegram analytics - disabled in development to prevent errors
console.log('🌐 Running in browser/development mode - Telegram analytics disabled');


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
                      <ErrorBoundary>
                        <App />
                      </ErrorBoundary>
                  </main>
              </ChatProvider>
              </WebSocketProvider>
            </InternetIdentityProvider>
          </AuthProviderLogin>
        </BrowserRouter>
      </TonConnectUIProvider>
    </HeroUIProvider>
  </React.StrictMode>
);
