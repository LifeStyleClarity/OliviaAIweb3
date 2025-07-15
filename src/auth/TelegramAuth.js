import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import * as api from './utils/api';
import { createDefaultUser, createDefaultGalaxyInstance, createDefaultProfileSettings } from './utils/defaults';
import { generateRefCode, getTelegramUserInfo, getReferralCodeFromURL, isTelegramWebApp } from './utils/helpers';
import { ERROR_MESSAGES } from './constants';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for handling Telegram authentication
 */
export const useTelegramAuth = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [userLoggingIn, setUserLoggingIn] = useState(null);
  const [allUserLogins, setAllUserLogins] = useState([]);

  // State setters from AuthContext that will be passed in
  const [userId, setUserId] = useState('');
  const [userGalaxyData, setUserGalaxyData] = useState(null);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const { telegramUser, setTelegramUser, setUserData } = useAuth();

  /**
   * Handles user login process
   * @param {Object} user - User object
   * @param {boolean} isTelegram - Whether this is a Telegram login
   */
  const loginUser = async (user, isTelegram = true) => {
    try {
      setTelegramUser(true);
      // setUserAuthenticated(!isTelegram);

      if (user) {
        // Check for Galaxy Blaster instance
        const galaxyInstance = await api.checkGalaxyBlasterInstance(user.user_id);

        if (galaxyInstance) {
          setUserGalaxyData(galaxyInstance);
          setUserId(user.user_id);
        } else {
          // Create new Galaxy Blaster instance if none exists
          const newInstance = createDefaultGalaxyInstance(user.user_id, user.walletAddress);
          const createdGalaxyInstance = await api.createGalaxyBlasterInstance(newInstance);
          setUserGalaxyData(createdGalaxyInstance);
          setUserId(user.user_id);
        }

        // Check for profile settings
        const profileSettings = await api.checkUserProfileSettingsExists(user.user_id);
        if (!profileSettings) {
          const newSettings = createDefaultProfileSettings(user.user_id);
          await api.createProfileSettingsUser(newSettings);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Error logging in. Please try again.');
    }
  };

  /**
   * Main function to handle Telegram authentication
   */
  const handleTelegramAuth = useCallback(async () => {

    //Uncomment this when go live
    // if (!isTelegramWebApp()) {
    //   toast.error(ERROR_MESSAGES.TELEGRAM_REQUIRED);
    //   return;
    // }

    setLoading(true);
    try {
      const telegramData = getTelegramUserInfo();
      // console.log("telegramData:", telegramData);
      if (!telegramData) {
        throw new Error(ERROR_MESSAGES.TELEGRAM_REQUIRED);
      }

      const { telegramId, telegramInfo } = telegramData;
      const refCode = getReferralCodeFromURL();
      const generatedRefCode = generateRefCode(String(telegramId));

      // Check for existing users with this Telegram ID
      const existingUsers = await api.getAllUsersTelegramId(telegramId);

      if (existingUsers) {
        // Filter users where is_tele_user is false or null
        // const filteredUsers = existingUsers.filter(
        //   user => user.is_tele_user === false || user.is_tele_user === null
        // );
        // console.log("filteredUsers:", filteredUsers);

        if (existingUsers.length > 0) {
          setTelegramUser(true);
          loginUser(existingUsers[0], true);
        } else {
          // Create new Telegram user
          const newUser = createDefaultUser({
            refCode,
            generatedRefCode,
            telegramInfo,
            telegramId: String(telegramId),
            isTeleUser: true
          });

          const createdUser = await api.createUser(newUser);
          if (createdUser) {
            setTelegramUser(true);
            loginUser(createdUser, true);
            setUserData(createdUser)
            //console.log("createdUser 1:", createdUser);

          }
        }
      } else {
        // Create new Telegram user
        const newUser = createDefaultUser({
          refCode,
          generatedRefCode,
          telegramInfo,
          telegramId: String(telegramId),
          isTeleUser: true
        });

        const createdUser = await api.createUser(newUser);
        if (createdUser) {
          //console.log("created user 2:", createdUser);
          setTelegramUser(true);
          setUserData(createdUser)
          loginUser(createdUser, true);
        }
      }
    } catch (error) {
      console.error('Error in handleTelegramAuth:', error);
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles adding a wallet to a Telegram user
   * @param {string} walletAddress - Wallet address to add
   * @param {string} walletType - Type of wallet
   */
  const handleAddWallet = async (walletAddress, walletType) => {
    setLoading(true);
    //console.log("userLoggingIn: ", userLoggingIn)
    try {
      const result = await api.updateUser(userLoggingIn.user_id, {
        crypto_wallet_address: walletAddress,
        crypto_wallet_type: walletType,
        is_tele_user: false
      });

      if (result) {
        await api.updateGalaxyBlasterInstance(userLoggingIn.user_id, walletAddress);
        loginUser(result);
      } else {
        toast.error(ERROR_MESSAGES.WALLET_UPDATE_ERROR);
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles logout
   */
  const handleLogout = () => {
    setUserId('');
    setUserGalaxyData(null);
    setUserAuthenticated(false);
    setTelegramUser(false);
    setAllUserLogins([]);
    setModalType(null);
    setUserLoggingIn(null);
  };

  return {
    // State
    loading,
    error,
    modalType,
    userLoggingIn,
    allUserLogins,
    userId,
    userGalaxyData,
    userAuthenticated,
    telegramUser,

    // Actions
    handleTelegramAuth,
    handleAddWallet,
    handleLogout
  };
};
