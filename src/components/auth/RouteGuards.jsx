import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInternetIdentity } from '../../contexts/InternetIdentityContext';
import { log } from '../../utils/logger.js';

export const PrivateRoute = () => {
  const { userAuthenticated, telegramUser, isGuestUser } = useAuth();
  const { isAuthenticated: internetIdentityAuth, principal } = useInternetIdentity();
  const location = useLocation();

  // Memoize access check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    return userAuthenticated || telegramUser || isGuestUser || internetIdentityAuth;
  }, [userAuthenticated, telegramUser, isGuestUser, internetIdentityAuth]);

  // Memoize debug info to prevent console spam
  const debugInfo = useMemo(() => ({
    userAuthenticated, 
    telegramUser, 
    isGuestUser,
    internetIdentityAuth,
    principal: principal ? `${principal.slice(0,10)}...` : null,
    pathname: location.pathname 
  }), [userAuthenticated, telegramUser, isGuestUser, internetIdentityAuth, principal, location.pathname]);

  log('🔒 PrivateRoute state:', debugInfo);

  if (!hasAccess) {
    log('🔒 PrivateRoute: BLOCKING ACCESS - All auth states are false');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  log('🔒 PrivateRoute: ALLOWING ACCESS - Auth method found');
  return <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { userAuthenticated, telegramUser, isGuestUser } = useAuth();
  const { isAuthenticated: internetIdentityAuth, principal } = useInternetIdentity();
  
  // Memoize authentication check to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => {
    return userAuthenticated || telegramUser || isGuestUser || internetIdentityAuth;
  }, [userAuthenticated, telegramUser, isGuestUser, internetIdentityAuth]);

  // Memoize debug info to prevent console spam
  const debugInfo = useMemo(() => ({
    userAuthenticated, 
    telegramUser, 
    isGuestUser,
    internetIdentityAuth,
    principal: principal ? `${principal.slice(0,10)}...` : null
  }), [userAuthenticated, telegramUser, isGuestUser, internetIdentityAuth, principal]);

  log('🔄 PublicRoute state:', debugInfo);
  
  if (isAuthenticated) {
    log('🔄 PublicRoute: User authenticated, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  log('🔄 PublicRoute: Showing login page');
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
