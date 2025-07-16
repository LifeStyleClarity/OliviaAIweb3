import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export function AuthProviderLogin({ children }) {
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [telegramUser, setTelegramUser] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);


  // Log auth state changes
  // useEffect(() => {
  //   //console.log('🔐 Auth state changed:', { userAuthenticated, userData, telegramUser });
  // }, [userAuthenticated, userData, telegramUser]);

  // Guest login function
  const loginAsGuest = () => {
    setIsGuestUser(true);
    setUserAuthenticated(false);
    setUserData({
      user_id: 'guest_user',
      first_name: 'Guest',
      last_name: 'User',
      email: 'guest@example.com',
      is_guest: true
    });
  };

  // Logout function
  const logout = () => {
    setUserAuthenticated(false);
    setUserData(null);
    setTelegramUser(false);
    setIsGuestUser(false);
  };

  const value = useMemo(() => ({
    userAuthenticated,
    setUserAuthenticated,
    userData,
    setUserData,
    telegramUser,
    setTelegramUser,
    isGuestUser,
    setIsGuestUser,
    loginAsGuest,
    logout
  }), [userAuthenticated, userData, telegramUser, isGuestUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProviderLogin.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProviderLogin');
  }
  return context;
};
