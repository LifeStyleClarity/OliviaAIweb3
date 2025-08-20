// File: src/contexts/WebSocketContext.jsx
// ✅ FIXED VERSION: Prevents unnecessary re-renders and mounting

import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import icpService from '../api/services/icp.service';
import { privacyService } from '../api/services/privacy.service.js';
import { aiService } from '../api/services/ai.service.js';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

const MAX_RETRIES = 10;
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 60000;

export const WebSocketProvider = ({ children }) => {
  // ✅ FIX 1: Add mount tracking for debugging
  const mountId = useRef(Math.random().toString(36).substr(2, 9));
  const mountCount = useRef(0);
  mountCount.current += 1;
  
  console.log(`🟦 WebSocketProvider mounting... (Mount #${mountCount.current}, ID: ${mountId.current})`);
  
  const wsRef = useRef(null);
  const messageHandlersRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const lastPongRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wsError, setWsError] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [shouldReconnect, setShouldReconnect] = useState(false);
  const [isServerUnavailable, setIsServerUnavailable] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  
  // ✅ FIX 2: Stable ICP state with useRef for objects
  const [icpInitialized, setIcpInitialized] = useState(true);
  const icpUserRef = useRef({ id: 'guest_user', isGuest: true });
  const [icpUser, setIcpUser] = useState(icpUserRef.current);
  
  // ✅ FIX 3: Stable conversation ID
  const conversationIdRef = useRef("conv_1754571813996_wga2cvd7j");
  const [conversationId, setConversationId] = useState(conversationIdRef.current);
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();

  // ✅ FIX 4: Memoized initializeICP with stable dependencies
  const initializeICP = useCallback(async () => {
    if (icpInitialized) {
      console.log(`🟦 ICP already initialized (${mountId.current})`);
      return;
    }
    
    try {
      console.log(`🟦 Initializing ICP for user... (${mountId.current})`);
      
      let user = await icpService.createGuestUser();
      
      if (user.success) {
        icpUserRef.current = user.user;
        setIcpUser(user.user);
        setIcpInitialized(true);
        
        const newConversationId = generateConversationId();
        conversationIdRef.current = newConversationId;
        setConversationId(newConversationId);
        
        console.log(`🟦 ICP user initialized successfully (${mountId.current}):`, user.user);
      } else {
        console.error(`🟦 Failed to create guest user (${mountId.current}):`, user.error);
        
        const fallbackUser = { id: 'fallback_user', isGuest: true };
        icpUserRef.current = fallbackUser;
        setIcpUser(fallbackUser);
        setIcpInitialized(true);
        
        const fallbackConversationId = generateConversationId();
        conversationIdRef.current = fallbackConversationId;
        setConversationId(fallbackConversationId);
      }
    } catch (error) {
      console.error(`🟦 ICP initialization error (${mountId.current}):`, error);
      
      const fallbackUser = { id: 'fallback_user', isGuest: true };
      icpUserRef.current = fallbackUser;
      setIcpUser(fallbackUser);
      setIcpInitialized(true);
      
      const fallbackConversationId = generateConversationId();
      conversationIdRef.current = fallbackConversationId;
      setConversationId(fallbackConversationId);
    }
  }, [icpInitialized]); // ✅ Only depend on icpInitialized, not changing objects

  // ✅ FIX 5: Stable function reference for debugging
  const initializeICPRef = useRef();
  initializeICPRef.current = initializeICP;

  // ✅ FIX 6: Combined useEffect for ICP initialization
  useEffect(() => {
    console.log(`🟦 ICP Auto-init useEffect running (${mountId.current}):`, { 
      userData: !!userData, 
      isGuestUser, 
      icpInitialized
    });
    
    if (!icpInitialized) {
      console.log(`🟦 FORCING ICP initialization (${mountId.current})`);
      initializeICPRef.current?.();
    }
    
    // ✅ Set up global debug function
    window.forceICPInit = () => {
      console.log(`🟦 MANUAL: Force ICP initialization from console (${mountId.current})`);
      initializeICPRef.current?.();
    };
    
    return () => {
      if (window.forceICPInit) {
        delete window.forceICPInit;
      }
    };
  }, [userData, isGuestUser, icpInitialized]); // ✅ Stable dependencies only

  // ✅ FIX 7: Mount/unmount with duplicate detection
  useEffect(() => {
    console.log(`🔌 Auto-connecting on mount (${mountId.current})...`);
    
    setIsMounted(true);
    setShouldReconnect(true);
    
    // ✅ Prevent duplicate connections
    const timeoutId = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log(`🔌 Starting WebSocket connection (${mountId.current})`);
        connectWebSocket();
      } else {
        console.log(`🔌 WebSocket already connected, skipping (${mountId.current})`);
      }
    }, 100);
    
    return () => {
      console.log(`🔌 Component unmounting (${mountId.current}), cleaning up WebSocket...`);
      clearTimeout(timeoutId);
      setIsMounted(false);
      setShouldReconnect(false);
      
      clearAllTimers();
      stopHeartbeat();
      
      if (wsRef.current) {
        wsRef.current.close(1000, `Component unmount (${mountId.current})`);
        wsRef.current = null;
      }
    };
  }, []); // ✅ Empty dependency array, only runs on actual mount/unmount

  // ✅ FIX 8: Simplified debug logging
  useEffect(() => {
    console.log(`🟦 ICP State (${mountId.current}):`, { 
      icpInitialized, 
      userId: icpUserRef.current?.id,
      conversationId: conversationIdRef.current
    });
  }, [icpInitialized]); // ✅ Only log when initialization status changes

  // ... rest of the component logic ...

  const value = {
    isConnected,
    isConnecting,
    connectionAttempts,
    wsError,
    currentAction,
    actionStatus,
    isStreamingResponse,
    shouldReconnect,
    isServerUnavailable,
    currentEndpointIndex,
    wsEndpoints: WS_ENDPOINTS,
    sendMessage,
    sendWebSocketMessage,
    subscribe,
    connect,
    disconnect: disconnectWebSocket,
    cancelStreamingResponse,
    generateRequestId,
    pendingRequests: pendingRequestsRef.current,
    // ICP Storage
    icpInitialized,
    icpUser: icpUserRef.current, // ✅ Use stable reference
    conversationId: conversationIdRef.current, // ✅ Use stable reference
    initializeICP: initializeICPRef.current, // ✅ Use stable reference
    saveToICP,
    getConversationHistory
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
