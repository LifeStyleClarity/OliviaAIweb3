// src/pages/Login.jsx
import { useTonConnectAuth, useTelegramAuth } from '../auth';
import { Spinner } from '@heroui/react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { WalletAuthModal } from '../components/WalletAuthModal';
import { useWalletAuthFlow } from '../hooks/useWalletAuthFlow';
import { useEffect } from 'react';

export default function Login() {
  // Auth hooks for wallet and Telegram
  const { loading: tonLoading, error: tonError, wallet } = useTonConnectAuth();
  const { loading: telegramLoading, handleTelegramAuth, error: telegramError } = useTelegramAuth();
  const loading = tonLoading || telegramLoading;

  // Authentication context (if needed)
  const { setUserAuthenticated, setUserData } = useAuth();

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

  }, []);

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

      <div className="min-h-screen bg-black flex items-center relative justify-center px-4 safe-area-view">
        <div className="w-full max-w-[300px] flex flex-col items-center z-10">
          <img
            src="/olivia-logo-white.png"
            alt="Olivia AI"
            className="w-auto h-[40px] mb-10"
          />
          <h1 className="text-[24px] font-bold text-center text-[#ffffff] mb-2">
            An All-in-one AI Engine
          </h1>
          <p className="text-[#888888] text-[16px] text-center mb-8">
            Join the AI Web3 community and unlock the power of AI with your ONAI Wallet
          </p>
          <div className="w-full flex flex-col items-center gap-5">
            {/* TON Connect Button */}
            <div
              className={`w-full flex justify-center items-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <TonConnectButton />
            </div>

            <div className="flex items-center gap-3 w-full">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-gray-400 text-sm">or</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            {/* Telegram Button */}
            <Button
              onPress={() => {
                //console.log('📱 Telegram auth button clicked');
                handleTelegramAuth();
              }}
              className="bg-transparent text-white/70 underline rounded-xl"
              isDisabled={loading}
            >
              {loading ? (
                <Spinner size="sm" color="white" />
              ) : (
                'Continue with Telegram'
              )}
            </Button>

            {/* Display any errors */}
            {(tonError || telegramError) && (
              <p className="text-red-500 text-sm text-center mt-2">
                {tonError?.message || telegramError?.message}
              </p>
            )}
          </div>
        </div>
        <div className="absolute -z-0 -top-80 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#206B18]/60 to-[#206B18]/70 blur-3xl animate-float" />
      </div>
    </>
  );
}
