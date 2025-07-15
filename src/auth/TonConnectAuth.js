import { useState, useCallback, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import * as api from './utils/api';
import { checkUserExists, getAllUsersTelegramId } from '../api/services/auth.service';

const getTelegramInfo = () => {
  // DEVELOPMENT: Using dummy data for testing
  // // Fabio Return
  // return [{
  //   ID: 1118448788,
  //   Is_Bot: "No",
  //   Language: "en",
  //   Username: "crosseo",
  //   Last_Name: "",
  //   First_Name: "Crosseo",
  //   Is_Premium_User: "No",
  //   Allows_Write_to_PM: "Yes",
  //   Added_to_Attachment_Menu: "No"
  // }];

  // Eduardo Return
  return [{
    ID: 952080226,
    Is_Bot: "No",
    Language: "en",
    Username: "Ed_Ai_dev",
    Last_Name: "Eduardo",
    First_Name: "Brito",
    Is_Premium_User: "No",
    Allows_Write_to_PM: "Yes",
    Added_to_Attachment_Menu: "No"
  }];
  // return [
  //   {
  //     "ID": 5473635519,
  //     "Is_Bot": "No",
  //     "Language": "en",
  //     "Username": "Bcaolivia",
  //     "Last_Name": "",
  //     "First_Name": "Bca",
  //     "Is_Premium_User": "Yes",
  //     "Allows_Write_to_PM": "Yes",
  //     "Added_to_Attachment_Menu": "No"
  //   }
  // ]


  // // //PRODUCTION: Uncomment this code
  // if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
  //   const tg = window.Telegram.WebApp;
  //   const user = tg.initDataUnsafe.user;
  //   return [{
  //     ID: user.id,
  //     Is_Bot: user.is_bot ? "Yes" : "No",
  //     Username: user.username,
  //     First_Name: user.first_name,
  //     Last_Name: user.last_name,
  //     Is_Premium_User: user.is_premium ? "Yes" : "No",
  //     Language: user.language_code,
  //     Added_to_Attachment_Menu: user.added_to_attachment_menu ? "Yes" : "No",
  //     Allows_Write_to_PM: user.allows_write_to_pm ? "Yes" : "No"
  //   }];
  // }
  // return [];
};

const getTelegramId = () => {
  // DEVELOPMENT: Using dummy data for testing
  // return "1118448788";
  return "952080226";
  // return "5473635519";

  // // // PRODUCTION: Uncomment this code
  // if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
  //   return String(window.Telegram.WebApp.initDataUnsafe.user.id);
  // }
  // return "";
};

export const useTonConnectAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // External hooks
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);

  const checkUser = useCallback(async () => {
    // if (!wallet) return;

    setLoading(true);
    try {
      const walletAddress = String(wallet.account.address);
      //console.log('🔍 Checking if user exists for wallet:', walletAddress);

      // Get Telegram info
      const telegramInfo = getTelegramInfo();
      //console.log('📱 Telegram info:', telegramInfo);

      // Get Telegram ID
      const telegramId = getTelegramId();
      //console.log('📱 Telegram ID:', telegramId);

      // First check if user exists with this wallet
      const user = await checkUserExists(walletAddress);
      //console.log("USER exist??: TonConnectAuth", user);
      // Check for accounts with same Telegram ID
      const telegramUsers = await getAllUsersTelegramId(telegramId);
      //console.log('📱 Checking Telegram accounts:', telegramUsers);

      if (user) {
        //console.log("user:", user);
        //console.log('✅ User exists with this wallet');

        // Update Telegram info if needed
        if (user.telegram_info === null || !user.telegram_info || user.telegram_info.length === 0) {
          //console.log('❌ User has no Telegram info');
          //console.log("user: ", user.user_id)
          if (telegramInfo.length > 0) {
            //console.log('✨ Updating user with Telegram info');
            await api.updateUser(user.user_id, {
              telegram_info: telegramInfo,
              telegram_id: telegramId
            });
          }
          const telegramUsers = await getAllUsersTelegramId(telegramId);
          // Flag that aggregation is required
          return {
            user,
            telegramUsers: telegramUsers || [],
            telegramId,
            needsAggregation: true
          };
        }

        // Return user and any other accounts with same Telegram ID
        if (telegramUsers && telegramUsers.length > 0) {
          //console.log('📱 Found other accounts with same Telegram ID');
          setAllUsers(telegramUsers);
        }

        return {
          user,
          telegramUsers: telegramUsers || [],
          telegramId
        };
      } else {
        //console.log('❌ No user found for this wallet');

        // Check if there are any accounts with this Telegram ID
        if (telegramUsers && telegramUsers.length > 0) {
          //console.log('📱 Found existing accounts with this Telegram ID');
          setAllUsers(telegramUsers);

          // Return null user but include Telegram users for modal handling
          return {
            user: null,
            telegramUsers,
            telegramId
          };
        }

        // No existing accounts at all
        //console.log('🆕 No existing accounts found');
        return {
          user: null,
          telegramUsers: [],
          telegramId
        };
      }
    } catch (error) {
      console.error('❌ Error checking user:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const handleWalletStatusChange = useCallback((connectedWallet) => {
    //console.log('👛 Wallet status changed:', connectedWallet ? 'Connected' : 'Disconnected');
    if (!connectedWallet) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(handleWalletStatusChange);
    return () => unsubscribe();
  }, [tonConnectUI, handleWalletStatusChange]);

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      navigate('/login');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast.error(error.message);
      // Still try to navigate even if disconnect fails
      navigate('/login');
    }
  };

  return {
    loading,
    error,
    wallet,
    handleDisconnect,
    checkUser,
    allUsers
  };
};
