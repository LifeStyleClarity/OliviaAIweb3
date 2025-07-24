import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import icpService from '../api/services/icp.service';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

const MAX_RETRIES = 10; // Increased for persistence
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const messageHandlersRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const connectionTimeoutRef = useRef(null);
  const lastPongRef = useRef(null);
  const pendingMessagesRef = useRef(new Map()); // Use ref instead of state
  
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
  
  // ICP Storage related state
  const [icpInitialized, setIcpInitialized] = useState(false);
  const [icpUser, setIcpUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();
  const { identity, isAuthenticated } = useInternetIdentity();

  // Constants
  const AGENT_ID = 'e66ea468-98a4-40a9-a9fd-803a39574e0e';
  const MODEL_NAME = 'gpt-4.1';
  
  // WebSocket endpoints to try (in order of preference)
  const wsBase = import.meta.env.VITE_WEBSOCKET_URL || 'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app';
  const WS_ENDPOINTS = [
    'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream' // EXACT WebSocket endpoint for Olivia AI
  ];
  
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Start heartbeat/ping mechanism
  const startHeartbeat = useCallback(() => {
    console.log('💓 Starting WebSocket heartbeat mechanism');
    
    clearInterval(heartbeatIntervalRef.current);
    lastPongRef.current = Date.now();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const now = Date.now();
        
        // Check if we missed a pong (connection might be dead)
        if (lastPongRef.current && (now - lastPongRef.current) > (HEARTBEAT_INTERVAL * 2)) {
          console.warn('💓 Heartbeat timeout detected, reconnecting...');
          wsRef.current.close(1000, 'Heartbeat timeout');
          return;
        }
        
        // Send ping
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: now }));
          console.log('💓 Ping sent');
        } catch (error) {
          console.error('💓 Failed to send ping:', error);
          wsRef.current.close(1000, 'Ping failed');
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    console.log('💓 Stopping WebSocket heartbeat');
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Generate request ID
  const generateRequestId = () => {
    return `req_${++requestIdRef.current}_${Date.now()}`;
  };

  // Generate conversation ID
  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Initialize ICP and create/get user
  const initializeICP = useCallback(async () => {
    if (icpInitialized) {
      console.log('🟦 ICP already initialized');
      return;
    }
    
    try {
      console.log('🟦 Initializing ICP for user...', { userData, isGuestUser });
      
      // Test ICP connection first
      const connectionTest = await icpService.testConnection();
      if (!connectionTest.success) {
        if (import.meta.env.DEV) {
          console.warn('🟦 ICP connection failed (development mode - this is normal if local ICP network is not running)');
          return;
        } else {
          console.error('🟦 ICP connection failed:', connectionTest.error);
          return;
        }
      }
      
      console.log('🟦 ICP connection test successful:', connectionTest.message);
      
      // Try to get existing user
      let user = await icpService.getUser();
      
      if (!user.success) {
        console.log('🟦 Creating new ICP user...', {
          hasUserData: !!userData,
          isGuestUser: isGuestUser,
          userData: userData
        });
        // Create new user based on auth data
        if (userData && !isGuestUser) {
          console.log('🟦 Creating REGULAR user because userData exists and not guest mode');
          const [firstName = '', ...lastNameParts] = (userData.contact_name || '').split(' ');
          const lastName = lastNameParts.join(' ');
          
          user = await icpService.createUser(
            firstName || userData.first_name || 'User',
            lastName || userData.last_name || '',
            userData.contact_email || userData.email || '',
            userData.telegram_id || null,
            userData.crypto_wallet_address || null
          );
        } else {
          console.log('🟦 Creating GUEST user because no userData or in guest mode', {
            hasUserData: !!userData,
            isGuestUser: isGuestUser
          });
          // Create guest user
          user = await icpService.createGuestUser();
        }
      }
      
      if (user.success) {
        setIcpUser(user.user);
        setIcpInitialized(true);
        
        // Generate conversation ID for this session
        if (!conversationId) {
          const newConversationId = generateConversationId();
          setConversationId(newConversationId);
          console.log('🟦 Generated conversation ID:', newConversationId);
        }
        
        console.log('🟦 ICP user initialized successfully:', user.user);
      } else {
        console.error('🟦 Failed to create/get ICP user:', user.error);
      }
    } catch (error) {
      console.error('🟦 ICP initialization error:', error);
    }
  }, [userData, isGuestUser, icpInitialized, conversationId]);

  // Retrieve conversation history from ICP
  const getConversationHistory = useCallback(async (limit = 10) => {
    if (!icpInitialized || !icpUser || !conversationId) {
      console.log('🟦 ICP not ready for history retrieval');
      return [];
    }
    
    try {
      console.log('🟦 Retrieving conversation history from ICP...');
      
      // Get messages for this conversation
      const result = await icpService.getConversationMessages(conversationId);
      
      if (result.success && result.messages) {
        // Sort messages by timestamp (oldest first)
        const sortedMessages = result.messages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        
        // Take the most recent messages (limit)
        const recentMessages = sortedMessages.slice(-limit);
        
        // Format for AI agent (alternating user/assistant messages)
        const formattedHistory = [];
        recentMessages.forEach(msg => {
          formattedHistory.push({
            role: 'user',
            content: msg.userMessage
          });
          formattedHistory.push({
            role: 'assistant', 
            content: msg.aiResponse
          });
        });
        
        console.log('🟦 Retrieved conversation history:', {
          totalMessages: result.messages.length,
          recentMessages: recentMessages.length,
          formattedHistory: formattedHistory.length
        });
        
        return formattedHistory;
      } else {
        console.log('🟦 No conversation history found or failed to retrieve');
        return [];
      }
    } catch (error) {
      console.error('🟦 Error retrieving conversation history:', error);
      return [];
    }
  }, [icpInitialized, icpUser, conversationId]);

  // Save message to ICP
  const saveToICP = useCallback(async (userMessage, aiResponse, requestId) => {
    console.log('🟦 saveToICP called with:', { 
      userMessage, 
      aiResponse, 
      requestId,
      icpInitialized,
      icpUser: icpUser?.id,
      conversationId,
      pendingMessagesCount: pendingMessagesRef.current.size
    });
    
    if (!icpInitialized || !icpUser || !conversationId) {
      console.log('🟦 ICP not ready, skipping save', {
        icpInitialized,
        hasIcpUser: !!icpUser,
        hasConversationId: !!conversationId
      });
      return;
    }
    
    try {
      console.log('🟦 Saving message to ICP:', { userMessage, aiResponse, requestId });
      
      const messageId = `msg_${requestId}_${Date.now()}`;
      const result = await icpService.saveMessage(
        messageId,
        userMessage,
        aiResponse,
        conversationId,
        true, // searchEnabled
        false // imageEnabled
      );
      
      if (result.success) {
        console.log('🟦 Message saved to ICP successfully:', result.message);
        
        // Remove from pending messages
        pendingMessagesRef.current.delete(requestId);
      } else {
        console.error('🟦 Failed to save message to ICP:', result.error);
      }
    } catch (error) {
      console.error('🟦 Error saving to ICP:', error);
    }
  }, [icpInitialized, icpUser, conversationId]);

  // Extract user options for WebSocket messages
  const extractUserOptions = useCallback(() => {
    const contactName = userData?.contact_name || '';
    const [firstName = '', ...lastNameParts] = contactName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    return {
      type: 'olivia_chat',
      firstName: firstName,
      lastName: lastName,
      email: userData?.contact_email || '',
      phoneNumber: userData?.contact_phone || '',
      companyName: userData?.company_name || '',
      userData: userData || null,
    };
  }, [userData]);

  const handleWebSocketMessage = useCallback((data) => {
    // Handle different message types
    switch (data.type) {
      case 'pong':
        // Handle pong response from server
        lastPongRef.current = Date.now();
        console.log('💓 Pong received, connection healthy');
        break;
      case 'stream_chunk':
        setIsStreamingResponse(true);
        break;
      case 'stream_complete':
        setIsStreamingResponse(false);
        // Save completed message to ICP
        console.log('🟦 Stream complete received:', { 
          requestId: data.requestId, 
          hasData: !!data.data,
          pendingMessagesCount: pendingMessagesRef.current.size,
          allPendingKeys: Array.from(pendingMessagesRef.current.keys())
        });
        
        if (data.requestId && data.data) {
          const pendingMessage = pendingMessagesRef.current.get(data.requestId);
          console.log('🟦 Found pending message:', { 
            hasPendingMessage: !!pendingMessage,
            pendingMessage,
            requestId: data.requestId
          });
          
          if (pendingMessage) {
            const aiResponse = data.data.fullResponse || data.data.text || '';
            console.log('🟦 Calling saveToICP with:', {
              userMessage: pendingMessage.userMessage,
              aiResponse: aiResponse.substring(0, 100) + '...',
              requestId: data.requestId
            });
            saveToICP(pendingMessage.userMessage, aiResponse, data.requestId);
          } else {
            console.log('🟦 No pending message found for requestId:', data.requestId);
          }
        } else {
          console.log('🟦 Missing requestId or data in stream_complete:', { 
            hasRequestId: !!data.requestId,
            hasData: !!data.data
          });
        }
        break;
      case 'explanation_chunk':
        setIsStreamingResponse(true);
        break;
      case 'explanation_complete':
        setIsStreamingResponse(false);
        break;
      case 'event':
        const { eventType, data: eventData } = data;
        if (eventType === 'action_start' && eventData.action === 'web_search') {
          setCurrentAction('web_search');
          setActionStatus('in_progress');
        } else if (eventType === 'action_complete') {
          setCurrentAction(null);
          setActionStatus(null);
        }
        break;
      case 'connection':
        console.log('✅ WebSocket connection established:', data.message);
        // Connection is ready, initialize ICP
        console.log('🟦 WebSocket connected, calling initializeICP...');
        initializeICP();
        break;
      case 'text':
        console.log('📝 Received text message:', data);
        // Text messages are handled by the ChatModal component through subscription
        break;
      case 'response':
        console.log('📝 Received response message:', data);
        // Response messages are handled by the ChatModal component through subscription
        break;
      default:
        console.log('Unknown message type:', data.type, 'Data:', data);
    }
    
    // Notify all subscribed handlers
    messageHandlersRef.current.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }, [initializeICP, saveToICP]);

  const connectWebSocket = useCallback(() => {
    if (isConnecting || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connecting or connected, skipping...');
      return;
    }

    // Only skip if component is unmounted
    if (!isMounted) {
      console.log('⚠️ Component unmounted, skipping connection attempt');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear all timers
    clearAllTimers();

    setIsConnecting(true);
    setWsError(null);

    const wsUrl = WS_ENDPOINTS[currentEndpointIndex];
    console.log('🔌 Connecting to Olivia AI WebSocket:', wsUrl, '(attempt:', connectionAttempts + 1, ')');
    
    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('🔌 Connection timeout, closing WebSocket');
        wsRef.current.close();
      }
    }, CONNECTION_TIMEOUT);
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Add a small delay to ensure the connection is fully established
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        setWsError(null);
        setIsServerUnavailable(false);
        console.log('✅ WebSocket connected successfully - starting heartbeat');
        
        // Start heartbeat mechanism
        startHeartbeat();
      }, 50);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received WebSocket message:', data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      stopHeartbeat(); // Stop heartbeat when connection closes
      
      console.log('🔌 WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
      
      // Persistent reconnection while component is mounted
      if (isMounted && shouldReconnect && event.code !== 1000) {
        // Calculate delay with exponential backoff (max 30 seconds)
        const delay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000);
        
        console.log(`🔄 Reconnecting in ${delay/1000}s... (attempt ${connectionAttempts + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }
        }, delay);
      } else if (!shouldReconnect) {
        console.log('🔌 Reconnection disabled, not attempting to reconnect');
      } else if (!isMounted) {
        console.log('🔌 Component unmounted, not attempting to reconnect');
      } else if (event.code === 1000) {
        console.log('🔌 Clean close, not attempting to reconnect');
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('🚨 Olivia AI WebSocket Error:', {
        url: wsUrl,
        error: error,
        readyState: wsRef.current?.readyState,
        attempt: connectionAttempts + 1,
        message: 'Failed to connect to Olivia AI service'
      });
      setWsError(error);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Clear any pending reconnection timeouts to prevent loops
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isConnecting, connectionAttempts, shouldReconnect, isServerUnavailable, currentEndpointIndex, handleWebSocketMessage]);

  const disconnectWebSocket = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket...');
    setShouldReconnect(false); // Disable reconnection when manually disconnecting
    
    // Clear all timers and stop heartbeat
    clearAllTimers();
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect'); // 1000 = normal closure
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
    setCurrentEndpointIndex(0); // Reset to first endpoint
    setIsServerUnavailable(false); // Reset server availability when manually disconnecting
    console.log('✅ WebSocket disconnected cleanly');
  }, [clearAllTimers, stopHeartbeat]);

  // Cancel current streaming response
  const cancelStreamingResponse = useCallback(() => {
    console.log('🚫 Canceling streaming response');
    
    // Clear streaming state
    setIsStreamingResponse(false);
    setCurrentAction(null);
    setActionStatus(null);
    
    // Clear pending requests
    pendingRequestsRef.current.clear();
    
    // Send cancel message to server if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const cancelMessage = {
        type: 'cancel',
        requestId: generateRequestId(),
        data: {
          message: 'User canceled streaming response'
        }
      };
      
      try {
        wsRef.current.send(JSON.stringify(cancelMessage));
      } catch (error) {
        console.error('Error sending cancel message:', error);
      }
    }
  }, []);

  const sendMessage = useCallback(async (message, conversationHistory = [], searchEnabled = false, imageEnabled = false) => {
    if (!wsRef.current) {
      console.log('❌ WebSocket reference is null');
      return false;
    }
    
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('❌ WebSocket is not connected. State:', wsRef.current.readyState, 'Expected:', WebSocket.OPEN);
      return false;
    }

    const requestId = generateRequestId();
    const userOptions = extractUserOptions();
    
    // Retrieve conversation history from ICP if not provided
    let historyToSend = conversationHistory;
    if (historyToSend.length === 0) {
      historyToSend = await getConversationHistory(10); // Get last 10 message pairs
      console.log('🟦 Retrieved conversation history for AI context:', {
        historyLength: historyToSend.length,
        hasHistory: historyToSend.length > 0
      });
    }
    
    const messageData = {
      type: 'text',
      requestId,
      data: {
        model: MODEL_NAME,
        text: message,
        messages: historyToSend,
        options: {
          agentId: AGENT_ID,
          search_available: searchEnabled,
          image_available: imageEnabled,
          ...userOptions
        }
      }
    };

    try {
      console.log('📡 Sending WebSocket message with history:', {
        ...messageData,
        data: {
          ...messageData.data,
          messages: `[${historyToSend.length} history messages]`
        }
      });
      wsRef.current.send(JSON.stringify(messageData));
      pendingRequestsRef.current.set(requestId, { content: message, timestamp: Date.now() });
      
      // Track for ICP storage
      pendingMessagesRef.current.set(requestId, { 
        userMessage: message, 
        timestamp: Date.now(),
        searchEnabled,
        imageEnabled
      });
      
      console.log('🟦 Added message to pending:', { 
        requestId,
        message: message.substring(0, 50) + '...',
        pendingCount: pendingMessagesRef.current.size
      });
      
      console.log('✅ Message sent successfully with requestId:', requestId);
      
      // Return the requestId so upgrade tracking can be done by the caller
      return requestId;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [extractUserOptions, getConversationHistory]);

  // Send WebSocket message function (for compatibility)
  const sendWebSocketMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((handler) => {
    messageHandlersRef.current.add(handler);
    
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Manual connect function that can be called when needed
  const connect = useCallback(() => {
    console.log('🔌 Manual connection requested');
    // Reset connection attempts, endpoint index, and server unavailable flag when manually connecting
    setConnectionAttempts(0);
    setCurrentEndpointIndex(0); // Start from first endpoint
    setIsServerUnavailable(false);
    setShouldReconnect(true); // Enable reconnection when manually connecting
    
    // Use timeout to avoid calling connectWebSocket directly in callback
    setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    }, 50);
  }, []); // No dependencies to avoid circular refs

  // Initialize ICP when user data changes
  useEffect(() => {
    if (userData || isGuestUser) {
      initializeICP();
    }
  }, [userData, isGuestUser, initializeICP]);

  // Enable reconnection on mount and auto-connect
  useEffect(() => {
    setIsMounted(true);
    setShouldReconnect(true);
    
    // Auto-connect when component mounts
    console.log('🔌 Auto-connecting on mount...');
    const timeoutId = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    }, 100); // Small delay to ensure state is set
    
    return () => {
      console.log('🔌 Component unmounting, cleaning up WebSocket...');
      clearTimeout(timeoutId);
      setIsMounted(false);
      setShouldReconnect(false); // Disable reconnection on unmount
      
      // Clear all timers and stop heartbeat
      clearAllTimers();
      stopHeartbeat();
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array to avoid circular dependencies

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
    icpUser,
    conversationId,
    initializeICP,
    saveToICP,
    getConversationHistory
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 