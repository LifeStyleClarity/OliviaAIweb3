import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Login from './pages/Login';

import Layout from './components/layout/Layout';
import { PrivateRoute, PublicRoute } from './components/auth/RouteGuards';
import { useState, useEffect } from 'react';
import QrCode from './pages/QrCode';

function App() {
  console.log('📱 App component rendering...');
  const [showQrCode, setShowQrCode] = useState(false);
  console.log('📱 App component state initialized');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData && tg.initDataUnsafe) {
      // Check if they're on Telegram WebApp
      // platform might be: 'android', 'ios', 'web', etc.
      if (tg.platform && tg.platform !== "web") {
        // => Official Telegram in‐app browser (mobile or desktop),
        //    not Telegram Web (browser).
        tg.expand();
        tg.disableVerticalSwipes();
        tg.onEvent("viewportChanged", () => {
          if (!tg.isExpanded) {
            tg.expand();
          }
        });
        return; // Keep normal flow
      }
    }

    // If we reach here:
    // 1) window.Telegram.WebApp is not defined at all, OR
    // 2) platform === "web" (Telegram Web in a browser, not in-app)
    setShowQrCode(false);
  }, []);

  return (
    <>
      <Routes>
        {showQrCode ? (
          // Redirect users to the QR Code page if they're not using Telegram.
          <Route path="/*" element={<QrCode />} />
        ) : (
          <>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />


            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/home" element={<Home />} />
              </Route>
            </Route>

            {/* Catch-all route for deleted/unknown pages */}
            <Route path="/icp-setup" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      <Toaster richColors position="bottom-right" closeButton />
    </>
  );
}

export default App;
