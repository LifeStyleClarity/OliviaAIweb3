// File: src/contexts/WebSocketContext.jsx
// 🚨 PROBLEMS: Multiple useEffect hooks causing re-renders

export const WebSocketProvider = ({ children }) => {
  console.log('🟦 WebSocketProvider mounting...'); // 🚨 THIS SHOWS MULTIPLE TIMES
  
  // ... state definitions ...
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();

  // 🚨 PROBLEM 1: This useEffect has unstable dependencies
  useEffect(() => {
    console.log('🟦 ICP State Changed:', { 
      icpInitialized, 
      hasIcpUser: !!icpUser, 
      hasConversationId: !!conversationId 
    });
  }, [icpInitialized, icpUser, conversationId]); // icpUser object changes reference

  // 🚨 PROBLEM 2: initializeICP function recreated on every render
  const initializeICP = useCallback(async () => {
    if (icpInitialized) {
      console.log('🟦 ICP already initialized');
      return;
    }
    
    try {
      console.log('🟦 Initializing ICP for user...', { userData, isGuestUser });
      
      // Force create guest user immediately - skip all checks
      console.log('🟦 FORCE: Creating guest user immediately');
      let user = await icpService.createGuestUser();
      
      if (user.success) {
        setIcpUser(user.user);
        setIcpInitialized(true);
        
        // Generate conversation ID for this session
        const newConversationId = generateConversationId();
        setConversationId(newConversationId);
        console.log('🟦 Generated conversation ID:', newConversationId);
        
        console.log('🟦 ICP user initialized successfully:', user.user);
      } else {
        console.error('🟦 Failed to create guest user:', user.error);
        
        // FALLBACK: Set minimal state to make it work
        console.log('🟦 FALLBACK: Setting minimal ICP state');
        setIcpUser({ id: 'fallback_user', isGuest: true });
        setIcpInitialized(true);
        setConversationId(generateConversationId());
      }
    } catch (error) {
      console.error('🟦 ICP initialization error:', error);
      
      // FALLBACK: Set minimal state to make it work
      console.log('🟦 ERROR FALLBACK: Setting minimal ICP state');
      setIcpUser({ id: 'fallback_user', isGuest: true });
      setIcpInitialized(true);
      setConversationId(generateConversationId());
    }
  }, [userData, isGuestUser, icpInitialized, conversationId]); // 🚨 UNSTABLE DEPENDENCIES

  // 🚨 PROBLEM 3: This useEffect runs every time initializeICP changes
  useEffect(() => {
    console.log('🟦 ICP Auto-init useEffect running:', { 
      userData: !!userData, 
      isGuestUser, 
      icpInitialized,
      hasInitializeICP: !!initializeICP
    });
    
    // Force initialization for ANY user state
    if (!icpInitialized) {
      console.log('🟦 FORCING ICP initialization - user will be created as guest');
      try {
        initializeICP(); // 🚨 This function reference changes frequently
      } catch (error) {
        console.error('🟦 Error calling initializeICP:', error);
      }
    }
  }, [userData, isGuestUser, icpInitialized, initializeICP]); // 🚨 initializeICP changes every render

  // 🚨 PROBLEM 4: Another useEffect with initializeICP dependency
  useEffect(() => {
    window.forceICPInit = () => {
      console.log('🟦 MANUAL: Force ICP initialization from console');
      initializeICP(); // 🚨 This causes re-renders when initializeICP changes
    };
    
    return () => {
      delete window.forceICPInit;
    };
  }, [initializeICP]); // 🚨 Triggers every time initializeICP is recreated

  // 🚨 PROBLEM 5: Auto-connect runs on every mount (which happens twice in StrictMode)
  useEffect(() => {
    setIsMounted(true);
    setShouldReconnect(true);
    
    // Auto-connect when component mounts
    console.log('🔌 Auto-connecting on mount...'); // 🚨 THIS LOGS TWICE
    const timeoutId = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket(); // 🚨 This tries to connect twice
      }
    }, 100);
    
    return () => {
      console.log('🔌 Component unmounting, cleaning up WebSocket...');
      clearTimeout(timeoutId);
      setIsMounted(false);
      setShouldReconnect(false);
      
      clearAllTimers();
      stopHeartbeat();
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array but still runs twice due to StrictMode

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
