// src/components/TopNavigation.jsx
import { useEffect, useState, useRef } from 'react';
import { TonConnectButton, useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { useInternetIdentity } from '../../contexts/InternetIdentityContext';

import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useWalletAuthFlow } from '../../hooks/useWalletAuthFlow';

import Button from '../ui/Button';
import { log } from '../../utils/logger.js';
import { useNavigate } from 'react-router-dom';
import { useAccountUpgrade } from '../../hooks/useAccountUpgrade';
import icpLogo from '../../assets/icp-logo.jpg';

export default function TopNavigation() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { setUserAuthenticated, telegramUser, setTelegramUser, isGuestUser, logout, userData, setUserData, setIsGuestUser } = useAuth();
  const { icpUser, icpInitialized } = useWebSocket();
  const { isAuthenticated: internetIdentityAuth, logout: logoutInternetIdentity, principal } = useInternetIdentity();
  const navigate = useNavigate();
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
  // Subscribe to authentication changes (wallet, telegram, internet identity)
  useEffect(() => {
    // If no authentication method is active, set userAuthenticated to false
    if (!wallet && !telegramUser && !internetIdentityAuth) {
      log('🔐 TopNav: No auth method detected, setting userAuthenticated=false');
      setUserAuthenticated(false);
    } else if (wallet) {
      log('🔐 TopNav: TON wallet detected, setting userAuthenticated=true');
      setTelegramUser(false);
      setUserAuthenticated(true);
    } else if (telegramUser) {
      log('🔐 TopNav: Telegram user detected, setting userAuthenticated=true');
      setTelegramUser(true);
      setUserAuthenticated(true);
    } else if (internetIdentityAuth) {
      log('🔐 TopNav: Internet Identity auth detected, setting userAuthenticated=true');
      setTelegramUser(false);
      setUserAuthenticated(true);
    }
  }, [wallet, setUserAuthenticated, telegramUser, internetIdentityAuth]);

  // Handle comprehensive logout for all authentication types
  const handleLogout = async () => {
    log('🔐 Logging out user...');
    
    try {
      // Disconnect from TON wallet if connected
      if (wallet && tonConnectUI) {
        log('🔐 Disconnecting from TON wallet');
        await tonConnectUI.disconnect();
      }
      
      // Logout from Internet Identity if authenticated
      if (internetIdentityAuth && logoutInternetIdentity) {
        log('🔐 Logging out from Internet Identity');
        await logoutInternetIdentity();
      }
      
      // Logout from regular auth context (covers guest, telegram, etc.)
      logout();
      
      // Navigate to login page
      navigate('/login');
      
      log('🔐 Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still navigate to login page even if there's an error
      navigate('/login');
    }
  };

  // Keep the old function name for backwards compatibility
  const handleGuestLogout = handleLogout;

  // ICP ID creation - handled inline now (setup page removed)
  const handleCreateICPID = () => {
    // ICP setup functionality moved inline - no separate page needed
    log('ICP ID creation requested - handled inline');
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

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      // Add a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // Debug logging for ICP state changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      log('🔑 TopNav ICP State:', {
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
      {/* Wallet authentication modal functionality removed */}

      <div className="px-4 py-4" style={{ zIndex: 2147483646 }}>
        <div className="flex justify-between items-center">
          {/* Left side - empty for now, could add logo */}
          <div></div>
          
          {/* Right side - User dropdown */}
          <div className="relative" ref={dropdownRef}>
            {isGuestUser ? (
              hasICPIdentity ? (
                // ICP Guest User Dropdown
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(prev => !prev);
                    }}
                    className="flex items-center gap-2 border-2 border-green-500 hover:border-green-400 text-white px-3 py-2 rounded-lg transition-colors bg-transparent hover:bg-green-500/10"
                  >
                    <img src={icpLogo} alt="ICP" className="w-5 h-5 rounded-full object-cover" />
                    <span className="text-sm font-mono text-green-400">{icpIdDisplay}</span>
                    <svg className={`w-4 h-4 transition-transform text-green-400 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div 
                      ref={dropdownRef}
                      data-dropdown="icp-guest"
                      className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
                      style={{ 
                        zIndex: 2147483647,
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <img src={icpLogo} alt="ICP" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="text-green-400 text-xs font-medium">ICP IDENTITY</div>
                            <div className="text-white text-sm">Guest User</div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-gray-400 text-xs mb-1 flex items-center justify-between">
                            <span>Complete ID:</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                navigator.clipboard.writeText(icpUser?.id?.toString() || '');
                              }}
                              className="text-green-400 hover:text-green-300 text-xs underline cursor-pointer"
                              style={{ pointerEvents: 'auto' }}
                            >
                              Copy
                            </button>
                          </div>
                          <div className="bg-gray-900 p-3 rounded border border-gray-600">
                            <span className="text-green-300 font-mono text-xs break-all">
                              {icpUser?.id?.toString() || 'Loading...'}
                            </span>
                          </div>
                    </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDropdownOpen(false);
                              handleCreateICPID();
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition-colors"
                          >
                            Upgrade to Internet Identity
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setIsDropdownOpen(false);
                              handleGuestLogout();
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded transition-colors cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                    >
                      Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Guest Mode (no ICP)
                <div className="flex items-center gap-2 flex-nowrap">
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
              </div>
              )
            ) : internetIdentityAuth ? (
              // Internet Identity User Dropdown
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDropdownOpen(prev => !prev);
                  }}
                  className="flex items-center gap-2 border-2 border-blue-500 hover:border-blue-400 text-white px-3 py-2 rounded-lg transition-colors bg-transparent hover:bg-blue-500/10"
                >
                  <img src={icpLogo} alt="ICP" className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-sm font-mono text-blue-400">{principal ? formatPrincipalId(principal) : 'Connected'}</span>
                  <svg className={`w-4 h-4 transition-transform text-blue-400 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div 
                    ref={dropdownRef}
                    data-dropdown="internet-identity"
                    className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
                      style={{ 
                        zIndex: 2147483647,
                        pointerEvents: 'auto'
                      }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={icpLogo} alt="ICP" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <div className="text-blue-400 text-xs font-medium">INTERNET IDENTITY</div>
                          <div className="text-white text-sm">Authenticated</div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-gray-400 text-xs mb-1 flex items-center justify-between">
                          <span>Principal ID:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              navigator.clipboard.writeText(principal?.toString() || '');
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs underline cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-gray-900 p-3 rounded border border-gray-600">
                          <span className="text-blue-300 font-mono text-xs break-all">
                            {principal?.toString() || 'Loading...'}
                  </span>
                </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                >
                  Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : wallet ? (
              // TON Wallet User
              <div className="flex items-center gap-2 flex-nowrap">
                <div className="flex flex-col">
                  <span className="text-cyan-400 text-xs">TON Wallet</span>
                  <span className="text-white text-sm font-mono">
                    {wallet.account.address ? 
                      `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}` : 
                      'Connected'
                    }
                  </span>
                </div>
                <Button
                  onPress={handleLogout}
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
        </div>
      </div>
    </>
  );
}
