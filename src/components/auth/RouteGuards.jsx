import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInternetIdentity } from '../../contexts/InternetIdentityContext';

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

  console.log('🔒 PrivateRoute state:', debugInfo);

  if (!hasAccess) {
    console.log('🔒 PrivateRoute: BLOCKING ACCESS - All auth states are false');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('🔒 PrivateRoute: ALLOWING ACCESS - Auth method found');
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

  console.log('🔄 PublicRoute state:', debugInfo);
  
  if (isAuthenticated) {
    console.log('🔄 PublicRoute: User authenticated, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  console.log('🔄 PublicRoute: Showing login page');
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
