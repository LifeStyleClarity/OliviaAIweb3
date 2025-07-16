import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

export const PrivateRoute = () => {
  const { userAuthenticated, telegramUser, isGuestUser } = useAuth();
  const location = useLocation();

  //console.log('🔒 PrivateRoute state:', { userAuthenticated, telegramUser, isGuestUser, location });

  // Allow access if user is authenticated, telegram user, or guest user
  if (!userAuthenticated && !telegramUser && !isGuestUser) {
    //console.log('🔒 PrivateRoute: Redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //console.log('🔒 PrivateRoute: Allowing access');
  return <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { userAuthenticated, telegramUser, isGuestUser } = useAuth();
  //console.log('🔄 PublicRoute state:', { userAuthenticated, telegramUser, isGuestUser });

  // If user is authenticated (including guest), redirect to home
  if (userAuthenticated || telegramUser || isGuestUser) {
    //console.log('🔄 PublicRoute: Redirecting to home');
    return <Navigate to="/home" replace />;
  }

  //console.log('🔄 PublicRoute: Showing login page');
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
