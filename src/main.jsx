import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import React from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ChatProvider } from './contexts/ChatContext.jsx'

import ChatModal from './components/ui/ChatModal.jsx'
import { AuthProviderLogin } from './contexts/AuthContext.jsx'
import { TokenInfluencerProvider } from './contexts/TokenInfluencerContext.jsx'

import TelegramAnalytics from '@telegram-apps/analytics'

TelegramAnalytics.init({
  token: import.meta.env.VITE_TG_ANAL_TOKEN,
  appName: import.meta.env.VITE_TG_ANAL_APP_NAME,
});


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <TonConnectUIProvider manifestUrl="https://app.olivianetwork.com/tonconnect-manifest.json">
        <BrowserRouter>
          <AuthProviderLogin>
            <ChatProvider>
              <TokenInfluencerProvider>
                <main className="dark text-foreground bg-background">
                  <ChatModal />
                  <App />
                </main>
              </TokenInfluencerProvider>
            </ChatProvider>
          </AuthProviderLogin>
        </BrowserRouter>
      </TonConnectUIProvider>
    </HeroUIProvider>
  </React.StrictMode>
);
