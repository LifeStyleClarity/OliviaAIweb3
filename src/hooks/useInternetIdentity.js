import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';

export const useInternetIdentity = () => {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth client ONLY when login is called - no automatic initialization
  const initializeAuthClient = async () => {
    if (authClient) return authClient;
    
    try {
      const client = await AuthClient.create();
      setAuthClient(client);
      
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const userIdentity = client.getIdentity();
        const userPrincipal = userIdentity.getPrincipal().toString();
        setIdentity(userIdentity);
        setPrincipal(userPrincipal);
      }
      
      return client;
    } catch (error) {
      console.error('Failed to initialize Internet Identity:', error);
      throw error;
    }
  };

  // Set loading to false on mount since we're not auto-initializing
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Login with Internet Identity
  const login = async () => {
    console.log('🔐 Internet Identity login requested');
    const client = await initializeAuthClient();
    
    try {
      setIsLoading(true);
      
      await client.login({
        identityProvider: 'https://identity.ic0.app',
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: () => {
          const userIdentity = client.getIdentity();
          const userPrincipal = userIdentity.getPrincipal().toString();
          
          setIdentity(userIdentity);
          setPrincipal(userPrincipal);
          setIsAuthenticated(true);
          
          console.log('🔐 Internet Identity login successful:', userPrincipal);
        },
        onError: (error) => {
          console.error('🔐 Internet Identity login error:', error);
          setIsLoading(false);
        }
      });
      
      return true;
    } catch (error) {
      console.error('🔐 Internet Identity login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    if (!authClient) return;
    
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
    } catch (error) {
      console.error('🔐 Internet Identity logout failed:', error);
    }
  };

  return {
    authClient,
    isAuthenticated,
    identity,
    principal,
    isLoading,
    login,
    logout
  };
}; 