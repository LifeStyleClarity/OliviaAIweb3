// src/components/TopNavigation.jsx
import { useEffect, useState } from 'react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import NotificationButton from '../ui/NotificationButton';
import AirdropButton from '../ui/AirdropButton';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useWalletAuthFlow } from '../../hooks/useWalletAuthFlow';
import { WalletAuthModal } from '../WalletAuthModal';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAccountUpgrade } from '../../hooks/useAccountUpgrade';

export default function TopNavigation() {
  const wallet = useTonWallet();
  const { setUserAuthenticated, telegramUser, setTelegramUser, isGuestUser, logout, userData, setUserData, setIsGuestUser } = useAuth();
  const { icpUser, icpInitialized } = useWebSocket();
  const navigate = useNavigate();
  // Remove isCreatingICP state since we're just triggering a conversation

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

  // Handle ICP ID creation - navigate to dedicated setup page
  const handleCreateICPID = () => {
    navigate('/icp-setup');
  };

  // Helper function to format Principal ID for display
  const formatPrincipalId = (principalId) => {
    if (!principalId) return null;
    const idString = principalId.toString();
    // Show first 5 and last 5 characters with ... in between
    return `${idString.slice(0, 5)}...${idString.slice(-5)}`;
  };

  // Check if user has ICP identity
  const hasICPIdentity = icpInitialized && icpUser && icpUser.id;
  const icpIdDisplay = hasICPIdentity ? formatPrincipalId(icpUser.id) : null;

  // Debug logging for ICP state changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔑 TopNav ICP State:', {
        isGuestUser,
        icpInitialized,
        hasICPUser: !!icpUser,
        hasICPIdentity,
        icpIdDisplay,
        icpUserIsGuest: icpUser?.isGuest
      });
    }
  }, [isGuestUser, icpInitialized, icpUser, hasICPIdentity, icpIdDisplay]);

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
          <div className="relative">
            {isGuestUser ? (
              <div className="flex items-center gap-2 flex-nowrap">
                {hasICPIdentity ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-green-400 text-xs">ICP ID</span>
                      <span className="text-white text-sm font-mono">{icpIdDisplay}</span>
                    </div>
                    <Button
                      onPress={handleGuestLogout}
                      className="bg-transparent text-white/70 underline text-sm"
                      size="sm"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 text-sm">Guest Mode</span>
                    <Button
                      onPress={handleGuestLogout}
                      className="bg-transparent text-white/70 underline text-sm"
                      size="sm"
                    >
                      Logout
                    </Button>
                    <Button
                      onPress={handleCreateICPID}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap"
                      size="sm"
                    >
                      Create ICP ID
                    </Button>
                  </>
                )}
              </div>
            ) : (
            <TonConnectButton className="!text-base bg-transparent" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            {!isGuestUser && <AirdropButton />}
            {!isGuestUser && <NotificationButton />}
          </div>
        </div>
      </div>
    </>
  );
}
