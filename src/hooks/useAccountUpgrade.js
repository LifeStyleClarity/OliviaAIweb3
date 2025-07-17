import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const [shouldShowUpgrade, setShouldShowUpgrade] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [canUpgrade, setCanUpgrade] = useState(false);
  const [isCheckingUpgrade, setIsCheckingUpgrade] = useState(false);

  // Initialize session tracking
  useEffect(() => {
    if (isGuestUser) {
      // Track session start time
      const sessionStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
      if (!sessionStart) {
        localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
      }

      // Load message count
      const savedCount = localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT);
      if (savedCount) {
        setMessageCount(parseInt(savedCount, 10));
      }

      // Check if account can be upgraded
      checkUpgradeEligibility();
    }
  }, [isGuestUser]);

  // Check if user's account can be upgraded
  const checkUpgradeEligibility = async () => {
    if (!userData || !userData.user_id || !isGuestUser) return;

    try {
      setIsCheckingUpgrade(true);
      const result = await icpService.canUpgradeAccount(userData.user_id);
      
      if (result.success) {
        setCanUpgrade(result.canUpgrade);
      }
    } catch (error) {
      console.error('Failed to check upgrade eligibility:', error);
    } finally {
      setIsCheckingUpgrade(false);
    }
  };

  // Track when user sends a message
  const trackMessage = useCallback(() => {
    if (!isGuestUser) return;

    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, newCount.toString());

    // Check if we should show upgrade prompt
    checkUpgradeConditions(newCount);
  }, [messageCount, isGuestUser]);

  // Check if upgrade conditions are met
  const checkUpgradeConditions = useCallback((currentMessageCount = messageCount) => {
    if (!isGuestUser || !canUpgrade) return;

    const now = Date.now();
    const sessionStart = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_START) || '0', 10);
    const lastShown = parseInt(localStorage.getItem(STORAGE_KEYS.UPGRADE_LAST_SHOWN) || '0', 10);
    const wasDismissed = localStorage.getItem(STORAGE_KEYS.UPGRADE_DISMISSED) === 'true';

    // Don't show if recently dismissed
    if (wasDismissed && (now - lastShown) < UPGRADE_TRIGGERS.RETRY_DELAY) {
      return;
    }

    // Show based on message count
    if (currentMessageCount >= UPGRADE_TRIGGERS.MESSAGE_COUNT) {
      setShouldShowUpgrade(true);
      return;
    }

    // Show based on time spent
    if (sessionStart && (now - sessionStart) >= UPGRADE_TRIGGERS.TIME_THRESHOLD) {
      setShouldShowUpgrade(true);
      return;
    }
  }, [isGuestUser, canUpgrade, messageCount]);

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
    if (isGuestUser && canUpgrade) {
      setShouldShowUpgrade(true);
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