// src/pages/Login.jsx
import { useTonConnectAuth, useTelegramAuth } from '../auth';
import { Spinner } from '@heroui/react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { WalletAuthModal } from '../components/WalletAuthModal';
import { useWalletAuthFlow } from '../hooks/useWalletAuthFlow';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  // Auth hooks for wallet and Telegram
  const { loading: tonLoading, error: tonError, wallet } = useTonConnectAuth();
  const { loading: telegramLoading, handleTelegramAuth, error: telegramError } = useTelegramAuth();
  const loading = tonLoading || telegramLoading;
  const videoRef = useRef(null);

  // Authentication context (if needed)
  const { setUserAuthenticated, setUserData, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  // Use our custom hook for shared wallet auth logic
  const {
    isModalOpen,
    modalUsers,
    isAggregating,
    modalMessages,
    handleAggregateAccounts,
    handleCancelAggregate,
  } = useWalletAuthFlow();

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

    // Auto-play video
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        console.log('Background video autoplay failed:', error);
      });
    }

  }, []);

  // Handle guest login
  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/home');
  };

  return (
    <>
      {/* Render the shared modal if needed */}
      <WalletAuthModal
        isOpen={isModalOpen}
        modalUsers={modalUsers}
        modalMessages={modalMessages}
        handleAggregateAccounts={handleAggregateAccounts}
        handleCancelAggregate={handleCancelAggregate}
        wallet={wallet}
      />

      <div className="min-h-screen flex items-center relative justify-center px-4 safe-area-view">
        {/* Background Video */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100vh',
            objectFit: 'cover'
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="w-full max-w-[600px] flex flex-col items-center z-10">
          <img
            src="/olivia-logo-white.png"
            alt="Olivia AI"
            className="w-auto h-[40px] mb-10"
          />
          <h1 className="text-[32px] font-bold text-center text-[#ffffff] mb-4">
            The Communications Layer for AI-Powered Web3
          </h1>
          <p className="text-[#cccccc] text-[18px] text-center mb-12 max-w-[500px]">
            Enabling dApps, wallets, and bots to launch real-time, intelligent agents in seconds. Every interaction is measurable, monetizable, and on-chain.
          </p>
          <div className="w-full flex flex-row items-center justify-center gap-3">
            {/* TON Connect Button */}
            <Button
              onPress={() => {
                // Get the TON Connect button element and click it
                const tonConnectBtn = document.querySelector('ton-connect-button');
                if (tonConnectBtn) {
                  tonConnectBtn.click();
                }
              }}
              className="flex-1 min-w-[160px] max-w-[180px] h-[48px] bg-[#0098EA] hover:bg-[#007ACC] text-white font-medium text-sm rounded-lg flex items-center justify-center"
              isDisabled={loading}
            >
              Connect Wallet
            </Button>

            {/* Telegram Button */}
            <Button
              onPress={() => {
                //console.log('📱 Telegram auth button clicked');
                handleTelegramAuth();
              }}
              className="flex-1 min-w-[160px] max-w-[180px] h-[48px] bg-[#31F46E] hover:bg-[#28d15a] text-black font-medium text-sm rounded-lg flex items-center justify-center"
              isDisabled={loading}
            >
              Continue with Telegram
            </Button>

            {/* Guest Button */}
            <Button
              onPress={handleGuestLogin}
              className="flex-1 min-w-[160px] max-w-[180px] h-[48px] bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-medium text-sm rounded-lg flex items-center justify-center"
              isDisabled={loading}
            >
              Continue as Guest
            </Button>
          </div>
          
          {/* Hidden TON Connect Button for functionality */}
          <div className="hidden">
            <TonConnectButton />
          </div>
        </div>
      </div>
    </>
  );
}
