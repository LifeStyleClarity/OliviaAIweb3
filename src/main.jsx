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
import { TokenInfluencerProvider } from './contexts/TokenInfluencerContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

import TelegramAnalytics from '@telegram-apps/analytics'

// Only initialize Telegram analytics if running inside Telegram
if (window.Telegram?.WebApp) {
  try {
TelegramAnalytics.init({
  token: import.meta.env.VITE_TG_ANAL_TOKEN,
  appName: import.meta.env.VITE_TG_ANAL_APP_NAME,
});
  } catch (error) {
    console.log('Telegram analytics not available in browser environment');
  }
}


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <TonConnectUIProvider manifestUrl="https://app.olivianetwork.com/tonconnect-manifest.json">
        <BrowserRouter>
          <AuthProviderLogin>
            <WebSocketProvider>
            <ChatProvider>
              <TokenInfluencerProvider>
                <main className="dark text-foreground bg-background">
                    <ErrorBoundary>
                      <ConditionalChatModal />
                    </ErrorBoundary>
                  <App />
                </main>
              </TokenInfluencerProvider>
            </ChatProvider>
            </WebSocketProvider>
          </AuthProviderLogin>
        </BrowserRouter>
      </TonConnectUIProvider>
    </HeroUIProvider>
  </React.StrictMode>
);
