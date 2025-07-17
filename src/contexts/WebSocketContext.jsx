import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import icpService from '../api/services/icp.service';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

const MAX_RETRIES = 4;

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const messageHandlersRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
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
  
  // ICP Storage related state
  const [icpInitialized, setIcpInitialized] = useState(false);
  const [icpUser, setIcpUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();

  // Constants
  const AGENT_ID = 'e66ea468-98a4-40a9-a9fd-803a39574e0e';
  const MODEL_NAME = 'gpt-4.1';
  
  // WebSocket endpoints to try (in order of preference)
  const wsBase = import.meta.env.VITE_WEBSOCKET_URL || 'wss://agents-micro-service-yr8zx.ondigitalocean.app';
  const WS_ENDPOINTS = [
    `${wsBase}/ws/agent/stream`,
    `${wsBase}/ws/agent/${AGENT_ID}`,
    `${wsBase}/ws/agents/${AGENT_ID}`,
    `${wsBase}/ws/chat/agents`,
    `${wsBase}/ws/chat`,
    `${wsBase}/ws/stream`,
    `${wsBase}/ws`
  ];
  
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

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
        console.error('🟦 ICP connection failed:', connectionTest.error);
        return;
      }
      
      console.log('🟦 ICP connection test successful:', connectionTest.message);
      
      // Try to get existing user
      let user = await icpService.getUser();
      
      if (!user.success) {
        console.log('🟦 Creating new ICP user...');
        // Create new user based on auth data
        if (userData && !isGuestUser) {
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
          console.log('🟦 Creating guest user...');
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

    // Don't attempt connection if server is marked as unavailable
    if (isServerUnavailable) {
      console.log('⚠️ Server marked as unavailable, skipping connection attempt');
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnecting(true);
    setWsError(null);

    const wsUrl = WS_ENDPOINTS[currentEndpointIndex];
    console.log('🔌 Connecting to WebSocket:', wsUrl, '(endpoint:', currentEndpointIndex + 1, '/', WS_ENDPOINTS.length, 'attempt:', connectionAttempts + 1, ')');
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      // Add a small delay to ensure the connection is fully established
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        setWsError(null);
        console.log('WebSocket connected successfully');
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
      console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
      
      // Only attempt to reconnect if it was an unexpected close (not manual)
      // and we haven't reached max attempts AND reconnection is enabled
      if (event.code !== 1000 && shouldReconnect) {
        if (connectionAttempts < MAX_RETRIES) {
          console.log('Attempting to reconnect... Attempt', connectionAttempts + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }, Math.pow(2, connectionAttempts) * 1000); // Exponential backoff
        } else {
          // Try next endpoint if available
          if (currentEndpointIndex < WS_ENDPOINTS.length - 1) {
            console.log('🔄 Trying next WebSocket endpoint...');
            setCurrentEndpointIndex(prev => prev + 1);
            setConnectionAttempts(0); // Reset attempts for new endpoint
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 1000);
          } else {
            console.log('🚫 All endpoints exhausted, marking server as unavailable');
            setIsServerUnavailable(true);
            setWsError('Chat service is currently unavailable');
            // Only show toast in production
            if (process.env.NODE_ENV === 'production') {
              toast.error('Chat service is currently unavailable');
            }
          }
        }
      } else if (!shouldReconnect) {
        console.log('Reconnection disabled, not attempting to reconnect');
      }
    };

    wsRef.current.onerror = (error) => {
      console.log('WebSocket connection error - this is normal during development');
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
    setShouldReconnect(false); // Disable reconnection when manually disconnecting
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear any pending reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
    setCurrentEndpointIndex(0); // Reset to first endpoint
    setIsServerUnavailable(false); // Reset server availability when manually disconnecting
    console.log('WebSocket disconnected');
  }, []);

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
    
    const messageData = {
      type: 'text',
      requestId,
      data: {
        model: MODEL_NAME,
        text: message,
        messages: conversationHistory,
        options: {
          agentId: AGENT_ID,
          search_available: searchEnabled,
          image_available: imageEnabled,
          ...userOptions
        }
      }
    };

    try {
      console.log('📡 Sending WebSocket message:', messageData);
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
  }, [extractUserOptions]);

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
    if (!isConnected && !isConnecting) {
      // Reset connection attempts, endpoint index, and server unavailable flag when manually connecting
      setConnectionAttempts(0);
      setCurrentEndpointIndex(0); // Start from first endpoint
      setIsServerUnavailable(false);
      setShouldReconnect(true); // Enable reconnection when manually connecting
      connectWebSocket();
    }
  }, [isConnected, isConnecting, shouldReconnect, isServerUnavailable, currentEndpointIndex, connectWebSocket]);

  // Initialize ICP when user data changes
  useEffect(() => {
    if (userData || isGuestUser) {
      initializeICP();
    }
  }, [userData, isGuestUser, initializeICP]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShouldReconnect(false); // Disable reconnection on unmount
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clear any pending reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

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
    saveToICP
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 