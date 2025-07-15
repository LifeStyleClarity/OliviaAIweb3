import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export function AuthProviderLogin({ children }) {
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [telegramUser, setTelegramUser] = useState(false);


  // Log auth state changes
  // useEffect(() => {
  //   //console.log('🔐 Auth state changed:', { userAuthenticated, userData, telegramUser });
  // }, [userAuthenticated, userData, telegramUser]);

  const value = useMemo(() => ({
    userAuthenticated,
    setUserAuthenticated,
    userData,
    setUserData,
    telegramUser,
    setTelegramUser
  }), [userAuthenticated, userData, telegramUser]);

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
