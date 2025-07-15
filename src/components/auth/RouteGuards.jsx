import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

export const PrivateRoute = () => {
  const { userAuthenticated } = useAuth();
  const location = useLocation();
  const { telegramUser, setTelegramUser } = useAuth();

  //console.log('🔒 PrivateRoute state:', { userAuthenticated, location });

  // Only allow access if user is authenticated
  if (!userAuthenticated && !telegramUser) {
    //console.log('🔒 PrivateRoute: Redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  //console.log('🔒 PrivateRoute: Allowing access');
  return <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { userAuthenticated } = useAuth();
  //console.log('🔄 PublicRoute state:', { userAuthenticated });

  // If user is authenticated, redirect to home
  if (userAuthenticated) {
    //console.log('🔄 PublicRoute: Redirecting to home');
    return <Navigate to="/" replace />;
  }

  //console.log('🔄 PublicRoute: Showing login page');
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
