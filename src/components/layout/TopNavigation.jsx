// src/components/TopNavigation.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import NotificationButton from '../ui/NotificationButton';
import AirdropButton from '../ui/AirdropButton';
import SettingsButton from '../ui/SettingsButton';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletAuthFlow } from '../../hooks/useWalletAuthFlow';
import { WalletAuthModal } from '../WalletAuthModal';

export default function TopNavigation() {
  const wallet = useTonWallet();
  const location = useLocation();
  const { setUserAuthenticated, telegramUser, setTelegramUser } = useAuth();

  // Use the shared hook for wallet authentication logic
  const {
    isModalOpen,
    modalUsers,
    modalMessages,
    handleAggregateAccounts,
    handleCancelAggregate,
  } = useWalletAuthFlow();

  // If a wallet is connected, update the authentication state.
  // useEffect(() => {
  //   if (wallet) {
  //     setUserAuthenticated(true);
  //   }
  // }, [wallet, setUserAuthenticated]);
  // Subscribe to wallet changes
  useEffect(() => {
    if (!wallet && !telegramUser) {
      setUserAuthenticated(false);
    } else if (wallet) {
      // console.log("wallet as been connected inside the home page");
      setTelegramUser(false)
      setUserAuthenticated(true);
    } else if (telegramUser) {
      setTelegramUser(true);
      setUserAuthenticated(true);
    }
  }, [wallet, setUserAuthenticated, telegramUser]);

  return (
    <>
      {/* Render the shared Wallet Authentication Modal if needed */}
      <WalletAuthModal
        isOpen={isModalOpen}
        modalUsers={modalUsers}
        modalMessages={modalMessages}
        handleAggregateAccounts={handleAggregateAccounts}
        handleCancelAggregate={handleCancelAggregate}
        wallet={wallet}
      />

      <div className="px-4 py-4 z-10">
        <div className="flex justify-between items-center">
          <div className="relative max-w-[200px]">
            <TonConnectButton className="!text-base bg-transparent" />
          </div>
          <div className="flex items-center gap-1">
            <AirdropButton />
            <NotificationButton />
            <AnimatePresence mode="wait">
              {location.pathname === '/portfolio' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <SettingsButton />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
