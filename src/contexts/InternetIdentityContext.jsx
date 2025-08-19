import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AuthClient } from '@dfinity/auth-client';

const InternetIdentityContext = createContext(null);

export function InternetIdentityProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const initializingRef = useRef(false);

  // Initialize auth client ONCE for the entire app
  const initializeAuthClient = async () => {
    if (authClient) {
      console.log('🔐 Internet Identity: Auth client already exists, returning existing client');
      return authClient;
    }
    
    if (initialized || initializingRef.current) {
      console.log('🔐 Internet Identity: Already initialized or initializing, skipping');
      return authClient;
    }
    
    try {
      console.log('🔐 Internet Identity: Initializing auth client (GLOBAL SINGLETON)...');
      initializingRef.current = true;
      setInitialized(true);
      
      const client = await AuthClient.create({
        createOptions: {
          idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true
          }
        }
      });
      
      console.log('🔐 Internet Identity: Auth client created successfully (SINGLETON)');
      setAuthClient(client);
      
      // Check if there's already an authenticated session
      const isAuth = await client.isAuthenticated();
      console.log('🔐 Internet Identity: Auth client initialized, checking existing session:', isAuth);
      
      if (isAuth) {
        const userIdentity = client.getIdentity();
        const userPrincipal = userIdentity.getPrincipal().toString();
        console.log('🔐 Internet Identity: Found existing session:', userPrincipal);
        setIdentity(userIdentity);
        setPrincipal(userPrincipal);
        setIsAuthenticated(true);
      } else {
        console.log('🔐 Internet Identity: No existing authentication session found');
      }
      
      return client;
    } catch (error) {
      console.error('❌ Internet Identity: Failed to initialize:', error);
      initializingRef.current = false;
      setInitialized(false);
      throw error;
    }
  };

  // Initialize once when provider mounts
  useEffect(() => {
    if (!initialized && !authClient && !initializingRef.current) {
      console.log('🔐 Internet Identity Provider: First and only initialization');
      initializeAuthClient();
    }
  }, []);

  // Login function
  const login = async () => {
    console.log('🔐 Internet Identity: Login requested');
    const client = await initializeAuthClient();
    
    try {
      setIsLoading(true);
      
      return new Promise((resolve, reject) => {
        client.login({
          identityProvider: 'https://identity.ic0.app',
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
          derivationOrigin: window.location.origin,
          windowOpenerFeatures: `
            left=${Math.round(screen.width / 2 - 400 / 2)},
            top=${Math.round(screen.height / 2 - 600 / 2)},
            toolbar=no,
            location=no,
            directories=no,
            status=no,
            menubar=no,
            scrollbars=yes,
            resizable=no,
            width=400,
            height=600
          `,
          onSuccess: () => {
            const userIdentity = client.getIdentity();
            const userPrincipal = userIdentity.getPrincipal().toString();
            
            console.log('🔐 Internet Identity: Login successful:', userPrincipal);
            console.log('🔐 Internet Identity: Setting auth states: isAuthenticated=true, principal=', userPrincipal);
            
            setIdentity(userIdentity);
            setPrincipal(userPrincipal);
            setIsAuthenticated(true);
            setIsLoading(false);
            
            console.log('🔐 Internet Identity: Auth states have been set in onSuccess callback');
            resolve(true);
          },
          onError: (error) => {
            console.error('🔐 Internet Identity: Login error:', error);
            
            // Check if this is a COOP error
            if (error?.message?.includes('Cross-Origin-Opener-Policy') || 
                error?.message?.includes('window.closed') ||
                error?.message?.includes('window.postMessage')) {
              console.warn('🔐 Internet Identity: COOP error detected - trying alternative approach...');
              
              // Try with a simpler window configuration
              setTimeout(() => {
                client.login({
                  identityProvider: 'https://identity.ic0.app',
                  maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
                  onSuccess: () => {
                    const userIdentity = client.getIdentity();
                    const userPrincipal = userIdentity.getPrincipal().toString();
                    console.log('🔐 Internet Identity: Fallback login successful:', userPrincipal);
                    setIdentity(userIdentity);
                    setPrincipal(userPrincipal);
                    setIsAuthenticated(true);
                    setIsLoading(false);
                    resolve(true);
                  },
                  onError: (fallbackError) => {
                    console.error('🔐 Internet Identity: Fallback login also failed:', fallbackError);
                    setIsLoading(false);
                    reject(fallbackError);
                  }
                });
              }, 100);
            } else {
              setIsLoading(false);
              reject(error);
            }
          }
        });
      });
    } catch (error) {
      console.error('🔐 Internet Identity: Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    if (!authClient) return;
    
    try {
      console.log('🔐 Internet Identity: Logging out...');
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      console.log('🔐 Internet Identity: Logout completed');
    } catch (error) {
      console.error('🔐 Internet Identity: Logout failed:', error);
    }
  };

  const value = useMemo(() => ({
    authClient,
    isAuthenticated,
    identity,
    principal,
    isLoading,
    login,
    logout
  }), [authClient, isAuthenticated, identity, principal, isLoading]);

  return (
    <InternetIdentityContext.Provider value={value}>
      {children}
    </InternetIdentityContext.Provider>
  );
}

InternetIdentityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useInternetIdentity = () => {
  const context = useContext(InternetIdentityContext);
  if (!context) {
    throw new Error('useInternetIdentity must be used within an InternetIdentityProvider');
  }
  return context;
};
