// src/components/TopNavigation.jsx
import { useEffect } from 'react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import NotificationButton from '../ui/NotificationButton';
import AirdropButton from '../ui/AirdropButton';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletAuthFlow } from '../../hooks/useWalletAuthFlow';
import { WalletAuthModal } from '../WalletAuthModal';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export default function TopNavigation() {
  const wallet = useTonWallet();
  const { setUserAuthenticated, telegramUser, setTelegramUser, isGuestUser, logout } = useAuth();
  const navigate = useNavigate();

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

  // Handle guest logout
  const handleGuestLogout = () => {
    logout();
    navigate('/');
  };

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
            {isGuestUser ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Guest Mode</span>
                <Button
                  onPress={handleGuestLogout}
                  className="bg-transparent text-white/70 underline text-sm"
                  size="sm"
                >
                  Logout
                </Button>
              </div>
            ) : (
            <TonConnectButton className="!text-base bg-transparent" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isGuestUser && <AirdropButton />}
            {!isGuestUser && <NotificationButton />}
          </div>
        </div>
      </div>
    </>
  );
}
