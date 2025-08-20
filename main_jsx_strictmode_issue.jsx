// File: src/main.jsx
// 🚨 PROBLEM: React.StrictMode causes double-mounting in development

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

try {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>  {/* 🚨 THIS CAUSES DOUBLE-MOUNTING */}
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
                  <WebSocketProvider>  {/* 🟦 THIS MOUNTS TWICE DUE TO STRICTMODE */}
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
}
