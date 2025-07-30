import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import icpService from '../api/services/icp.service';

const UPGRADE_TRIGGERS = {
  MESSAGE_COUNT: 5,        // Show after 5 messages
  TIME_THRESHOLD: 3 * 60 * 1000, // Show after 3 minutes
  RETRY_DELAY: 30 * 60 * 1000,   // Show again after 30 minutes if dismissed
};

const STORAGE_KEYS = {
  UPGRADE_DISMISSED: 'upgrade_dismissed',
  UPGRADE_LAST_SHOWN: 'upgrade_last_shown',
  MESSAGE_COUNT: 'guest_message_count',
  SESSION_START: 'session_start_time',
};

export const useAccountUpgrade = () => {
  const { userData, isGuestUser } = useAuth();
  const { icpUser, icpInitialized } = useWebSocket();
  const [shouldShowUpgrade, setShouldShowUpgrade] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [canUpgrade, setCanUpgrade] = useState(false);
  const [isCheckingUpgrade, setIsCheckingUpgrade] = useState(false);
  const sessionRef = useRef({ initialized: false });

  // Initialize session tracking
  useEffect(() => {
    if (import.meta.env.DEV && !sessionRef.current.initialized) {
      console.log('🔄 Initialize session tracking:', { isGuestUser });
    }
    
    if (isGuestUser) {
      // Track session start time
      const sessionStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
      const savedCount = localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT);
      const wasDismissed = localStorage.getItem(STORAGE_KEYS.UPGRADE_DISMISSED);
      const lastShown = localStorage.getItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN);
      
      if (import.meta.env.DEV && !sessionRef.current.initialized) {
        console.log('💾 localStorage state:', {
          sessionStart,
          savedCount,
          wasDismissed,
          lastShown
        });
        sessionRef.current.initialized = true;
      }
      
      if (!sessionStart) {
        localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
        console.log('🕐 Set new session start time');
      }

      // Load message count
      if (savedCount) {
        const count = parseInt(savedCount, 10);
        setMessageCount(count);
        console.log('Loaded saved message count:', count);
      }

      // Check if account can be upgraded
      checkUpgradeEligibility();
    }
  }, [isGuestUser]);

  // Check if user's account can be upgraded
  const checkUpgradeEligibility = async () => {
    // For regular guest users (no ICP identity yet), they can always "upgrade" to ICP
    if (isGuestUser) {
      setCanUpgrade(true);
      return;
    }
    
    setCanUpgrade(false);
  };

  // Track when user sends a message
  const trackMessage = useCallback(() => {
    console.log('trackMessage called!', { isGuestUser, canUpgrade, messageCount });
    
    if (!isGuestUser) {
      console.log('Not a guest user, skipping track');
      return;
    }

    const newCount = messageCount + 1;
    console.log('Message count:', { oldCount: messageCount, newCount });
    
    setMessageCount(newCount);
    localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, newCount.toString());

    // Check if we should show upgrade prompt
    checkUpgradeConditions(newCount);
  }, [messageCount, isGuestUser, canUpgrade]);

  // Send ICP identity creation message to chat
  const sendICPCreationMessage = useCallback(() => {
    console.log('sendICPCreationMessage called!');
    console.log('window.sendChatMessage exists?', typeof window !== 'undefined' && !!window.sendChatMessage);
    
    if (typeof window !== 'undefined' && window.sendChatMessage) {
      console.log('Sending ICP creation message to chat!');
      window.sendChatMessage({
        message: "Hey! I've been enjoying our conversation so far! 😊\n\nI have an idea - if you create an ICP identity, I can save all our conversations so I can remember everything we've talked about. This means:\n\n• I'll remember your preferences and past discussions\n• Our conversations will be saved permanently on the blockchain\n• I can learn your communication style and work better for you over time\n• You'll never lose our chat history, even if you switch devices\n\nIt only takes 2 minutes and uses your device's Face ID or Touch ID - no passwords needed!\n\nWant me to help you set this up? I think it would really improve how I can assist you! 🚀",
        action: {
          type: "create_icp_identity"
        }
      });
    } else {
      console.log('window.sendChatMessage not available');
    }
  }, []);

  // Check if upgrade conditions are met
  const checkUpgradeConditions = useCallback((currentMessageCount = messageCount) => {
    console.log('checkUpgradeConditions called!', { 
      isGuestUser, 
      canUpgrade, 
      currentMessageCount, 
      messageCount 
    });
    
    if (!isGuestUser || !canUpgrade) {
      console.log('Conditions not met:', { isGuestUser, canUpgrade });
      return;
    }

    const now = Date.now();
    const sessionStart = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_START) || '0', 10);
    const lastShown = parseInt(localStorage.getItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN) || '0', 10);
    const wasDismissed = localStorage.getItem(STORAGE_KEYS.UPGRADE_DISMISSED) === 'true';

    console.log('📋 Upgrade state:', { 
      now, 
      sessionStart, 
      lastShown, 
      wasDismissed,
      timeSinceLastShown: now - lastShown,
      retryDelay: UPGRADE_TRIGGERS.RETRY_DELAY
    });

    // Don't show if recently dismissed
    if (wasDismissed && (now - lastShown) < UPGRADE_TRIGGERS.RETRY_DELAY) {
      console.log('Recently dismissed, skipping');
      return;
    }

    // Show based on message count (changed from 5 to 3)
    if (currentMessageCount >= 3) {
      console.log('Message count trigger! Sending ICP creation message');
      sendICPCreationMessage();
      localStorage.setItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN, now.toString());
      return;
    }

    // Show based on time spent
    if (sessionStart && (now - sessionStart) >= UPGRADE_TRIGGERS.TIME_THRESHOLD) {
      console.log('Time trigger! Sending ICP creation message');
      sendICPCreationMessage();
      localStorage.setItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN, now.toString());
      return;
    }

    console.log('⏳ No triggers met yet');
  }, [isGuestUser, canUpgrade, messageCount, sendICPCreationMessage]);

  // Handle when user dismisses the prompt
  const dismissUpgradePrompt = useCallback(() => {
    setShouldShowUpgrade(false);
    localStorage.setItem(STORAGE_KEYS.UPGRADE_DISMISSED, 'true');
    localStorage.setItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN, Date.now().toString());
  }, []);

  // Handle successful upgrade
  const handleUpgradeSuccess = useCallback(() => {
    setShouldShowUpgrade(false);
    
    // Clear guest session data
    localStorage.removeItem(STORAGE_KEYS.UPGRADE_DISMISSED);
    localStorage.removeItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    
    setMessageCount(0);
    setCanUpgrade(false);
  }, []);

  // Force show upgrade prompt (for testing or manual trigger)
  const forceShowUpgrade = useCallback(() => {
    console.log('forceShowUpgrade called!', { isGuestUser, canUpgrade });
    
    if (isGuestUser && canUpgrade) {
      console.log('Showing upgrade prompt');
      setShouldShowUpgrade(true);
    } else {
      console.log('Cannot show upgrade:', { isGuestUser, canUpgrade });
    }
  }, [isGuestUser, canUpgrade]);

  // Reset upgrade state (for testing)
  const resetUpgradeState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.UPGRADE_DISMISSED);
    localStorage.removeItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    
    setMessageCount(0);
    setShouldShowUpgrade(false);
    
    // Restart session tracking
    if (isGuestUser) {
      localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
    }
  }, [isGuestUser]);

  return {
    shouldShowUpgrade,
    messageCount,
    canUpgrade,
    isCheckingUpgrade,
    trackMessage,
    dismissUpgradePrompt,
    handleUpgradeSuccess,
    forceShowUpgrade,
    resetUpgradeState,
    checkUpgradeEligibility,
  };
}; 