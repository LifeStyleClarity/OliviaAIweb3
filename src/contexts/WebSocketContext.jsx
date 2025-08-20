import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import icpService from '../api/services/icp.service';
import { privacyService } from '../api/services/privacy.service.js';
import { log, error, warn } from '../utils/logger.js';
import { aiService } from '../api/services/ai.service.js';
import { ENDPOINTS, OPENAI_MICROSERVICE_CONFIG } from '../api/config/endpoints.js';

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
  log('🟦 WebSocketProvider mounting...');
  
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
  
  // ICP Storage related state - FORCE INITIALIZE IMMEDIATELY
  const [icpInitialized, setIcpInitialized] = useState(true); // START AS TRUE
  const [icpUser, setIcpUser] = useState({ id: 'guest_user', isGuest: true }); // SET IMMEDIATELY
  
  // Generate or load conversation ID with 90-day expiration
  const [conversationId, setConversationId] = useState(() => {
    const STORAGE_KEY = 'olivia_conversation_id';
    const EXPIRATION_KEY = 'olivia_conversation_id_expires';
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    
    try {
      const storedId = localStorage.getItem(STORAGE_KEY);
      const storedExpiration = localStorage.getItem(EXPIRATION_KEY);
      
      // Check if we have a stored ID and it hasn't expired
      if (storedId && storedExpiration) {
        const expirationTime = parseInt(storedExpiration, 10);
        const now = Date.now();
        
        if (now < expirationTime) {
          log('🟦 Loading existing conversation ID from localStorage:', storedId);
          return storedId;
        } else {
          log('🟦 Stored conversation ID expired, generating new one');
          // Clear expired data
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(EXPIRATION_KEY);
        }
      }
      
      // Generate truly random conversation ID every time
      const timestamp = Date.now();
      const randomPart1 = Math.random().toString(36).substr(2, 9);
      const randomPart2 = Math.random().toString(36).substr(2, 6);
      const newConversationId = `conv_${timestamp}_${randomPart1}_${randomPart2}`;
      const expirationTime = Date.now() + NINETY_DAYS_MS;
      
      // Store with expiration
      localStorage.setItem(STORAGE_KEY, newConversationId);
      localStorage.setItem(EXPIRATION_KEY, expirationTime.toString());
      
      log('🟦 Generated new conversation ID:', newConversationId);
      log('🟦 Conversation ID expires on:', new Date(expirationTime).toLocaleDateString());
      
      return newConversationId;
    } catch (error) {
      error('🟦 Error managing conversation ID localStorage:', error);
      // Fallback: generate temporary random ID without storage
      const fallbackId = generateConversationId();
      log('🟦 Using fallback conversation ID:', fallbackId);
      return fallbackId;
    }
  });
  
  // Debug ICP state changes
  useEffect(() => {
    log('🟦 ICP State Changed:', { icpInitialized, hasIcpUser: !!icpUser, hasConversationId: !!conversationId });
  }, [icpInitialized, icpUser, conversationId]);
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();

  // Constants
  const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'e66ea468-98a4-40a9-a9fd-803a39574e0e';
  const MODEL_NAME = 'gpt-4.1';
  
  // WebSocket endpoints - Secure-only mode using microservice proxy
  const WS_ENDPOINTS = [
    ENDPOINTS.WEBSOCKET.SECURE_PROXY, // Secure proxy endpoint (only option)
  ];
  
  // Fallback endpoints for development/emergency use (secured via environment variables)
  const FALLBACK_ENDPOINTS = process.env.NODE_ENV === 'development' 
    ? [import.meta.env.VITE_FALLBACK_WS_URL || 'ws://localhost:8080/ws/agent/stream']
    : []; // No fallbacks in production - microservice only
  
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
    log('💓 Starting WebSocket heartbeat mechanism');
    
    clearInterval(heartbeatIntervalRef.current);
    lastPongRef.current = Date.now();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const now = Date.now();
        
        // Check if we missed a pong (connection might be dead)
        if (lastPongRef.current && (now - lastPongRef.current) > (HEARTBEAT_INTERVAL * 2)) {
          warn('💓 Heartbeat timeout detected, reconnecting...');
          wsRef.current.close(1000, 'Heartbeat timeout');
          return;
        }
        
        // Send ping
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: now }));
          log('💓 Ping sent');
        } catch (error) {
          error('💓 Failed to send ping:', error);
          wsRef.current.close(1000, 'Ping failed');
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    log('💓 Stopping WebSocket heartbeat');
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Generate request ID
  const generateRequestId = () => {
    return `req_${++requestIdRef.current}_${Date.now()}`;
  };

  // Generate truly random conversation ID every time
  const generateConversationId = () => {
    const timestamp = Date.now();
    const randomPart1 = Math.random().toString(36).substr(2, 9);
    const randomPart2 = Math.random().toString(36).substr(2, 6);
    return `conv_${timestamp}_${randomPart1}_${randomPart2}`;
  };

  // Clear conversation ID and start fresh (useful for testing or user logout)
  const clearConversationId = useCallback(() => {
    const STORAGE_KEY = 'olivia_conversation_id';
    const EXPIRATION_KEY = 'olivia_conversation_id_expires';
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRATION_KEY);
      
      // Generate new conversation ID
      const newConversationId = generateConversationId();
      const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
      const expirationTime = Date.now() + NINETY_DAYS_MS;
      
      localStorage.setItem(STORAGE_KEY, newConversationId);
      localStorage.setItem(EXPIRATION_KEY, expirationTime.toString());
      
      setConversationId(newConversationId);
      
      log('🟦 Cleared old conversation ID and generated new one:', newConversationId);
      log('🟦 New conversation ID expires on:', new Date(expirationTime).toLocaleDateString());
      
      return newConversationId;
    } catch (error) {
      error('🟦 Error clearing conversation ID:', error);
      return null;
    }
  }, []);

  // Initialize ICP and create/get user
  const initializeICP = useCallback(async () => {
    if (icpInitialized) {
      log('🟦 ICP already initialized');
      return;
    }
    
    try {
      log('🟦 Initializing ICP for user...', { userData, isGuestUser });
      
      // Skip connection test in development - just proceed with user creation
      log('🟦 Skipping ICP connection test in development - proceeding with user creation');
      
      // Force create guest user immediately - skip all checks
      log('🟦 FORCE: Creating guest user immediately');
      let user = await icpService.createGuestUser();
      
      if (user.success) {
        setIcpUser(user.user);
        setIcpInitialized(true);
        
        // Generate conversation ID for this session
        const newConversationId = generateConversationId();
        setConversationId(newConversationId);
        log('🟦 Generated conversation ID:', newConversationId);
        
        log('🟦 ICP user initialized successfully:', user.user);
      } else {
        error('🟦 Failed to create guest user:', user.error);
        
        // FALLBACK: Set minimal state to make it work
        log('🟦 FALLBACK: Setting minimal ICP state');
        setIcpUser({ id: 'fallback_user', isGuest: true });
        setIcpInitialized(true);
        setConversationId(generateConversationId());
      }
    } catch (error) {
      error('🟦 ICP initialization error:', error);
      
      // FALLBACK: Set minimal state to make it work
      log('🟦 ERROR FALLBACK: Setting minimal ICP state');
      setIcpUser({ id: 'fallback_user', isGuest: true });
      setIcpInitialized(true);
      setConversationId(generateConversationId());
    }
  }, [userData, isGuestUser, icpInitialized, conversationId]);

  // Retrieve conversation history from ICP
  const getConversationHistory = useCallback(async (limit = 10) => {
    if (!icpInitialized || !icpUser || !conversationId) {
      log('🟦 ICP not ready for history retrieval');
      return [];
    }
    
    try {
      log('🟦 Retrieving conversation history from ICP...');
      
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
        
        log('🟦 Retrieved conversation history:', {
          totalMessages: result.messages.length,
          recentMessages: recentMessages.length,
          formattedHistory: formattedHistory.length
        });
        
        return formattedHistory;
      } else {
        log('🟦 No conversation history found or failed to retrieve');
        return [];
      }
    } catch (error) {
      error('🟦 Error retrieving conversation history:', error);
      return [];
    }
  }, [icpInitialized, icpUser, conversationId]);

  // Save message to ICP with privacy filtering
  const saveToICP = useCallback(async (userMessage, aiResponse, requestId) => {
    log('🟦 saveToICP called with:', { 
      userMessage, 
      aiResponse, 
      requestId,
      icpInitialized,
      icpUser: icpUser?.id,
      conversationId,
      pendingMessagesCount: pendingMessagesRef.current.size
    });
    
    try {
      log('🔒 Processing messages through privacy filter...');
      
      // 🔒 PRIVACY FILTER: ALWAYS analyze messages regardless of ICP status
      const privacyResult = await privacyService.processMessages(
        userMessage, 
        aiResponse, 
        icpUser?.id?.toString() || 'guest_user'
      );
      
      // Use processed (potentially hashed) messages
      const finalUserMessage = privacyResult.userMessage;
      const finalAiResponse = privacyResult.aiResponse;
      
      // Log privacy actions taken
      if (privacyResult.privacy?.userMessageHashed || privacyResult.privacy?.aiResponseHashed) {
        log('🔒 Privacy protection applied:', {
          userMessageHashed: privacyResult.privacy.userMessageHashed,
          aiResponseHashed: privacyResult.privacy.aiResponseHashed,
          userReasons: privacyResult.privacy.userAnalysis?.reasons || [],
          aiReasons: privacyResult.privacy.aiAnalysis?.reasons || []
        });
      } else {
        log('🔒 No sensitive content detected, messages stored as-is');
      }
      
      // Check if ICP is ready for storage
      if (!icpInitialized || !icpUser || !conversationId) {
        log('🟦 ICP not ready, skipping storage (but privacy analysis completed)', {
          icpInitialized,
          hasIcpUser: !!icpUser,
          hasConversationId: !!conversationId,
          privacyProcessed: true
        });
        return;
      }
      
      log('🟦 Saving processed message to ICP:', { 
        originalUserLength: userMessage?.length || 0,
        finalUserLength: finalUserMessage?.length || 0,
        originalAiLength: aiResponse?.length || 0,
        finalAiLength: finalAiResponse?.length || 0,
        requestId 
      });
      
      // Validate messages before saving
      if (!finalUserMessage || !finalAiResponse) {
        error('🟦 Cannot save to ICP: missing user or AI message', {
          hasUserMessage: !!finalUserMessage,
          hasAiResponse: !!finalAiResponse
        });
        return;
      }

      const messageId = `msg_${requestId}_${Date.now()}`;
      const result = await icpService.saveMessage(
        messageId,
        finalUserMessage,
        finalAiResponse,
        conversationId,
        true, // searchEnabled
        false // imageEnabled
      );
      
      if (result.success) {
        log('🟦 Message saved to ICP successfully:', result.message);
        
        // Remove from pending messages
        pendingMessagesRef.current.delete(requestId);
      } else {
        error('🟦 Failed to save message to ICP:', result.error);
      }
      
    } catch (error) {
      error('🔒 Error in privacy processing or ICP save:', error);
      
      // Fallback: if ICP is ready but privacy processing failed, save original messages
      if (icpInitialized && icpUser && conversationId) {
        try {
          log('🟦 Fallback: saving original messages due to privacy processing error');
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
            pendingMessagesRef.current.delete(requestId);
          }
        } catch (fallbackError) {
          error('🟦 Fallback save also failed:', fallbackError);
        }
      }
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
        log('💓 Pong received, connection healthy');
        break;
      case 'stream_chunk':
        setIsStreamingResponse(true);
        break;
      case 'stream_complete':
        setIsStreamingResponse(false);
        // Save completed message to ICP
        log('🟦 Stream complete received:', { 
          requestId: data.requestId, 
          hasData: !!data.data,
          pendingMessagesCount: pendingMessagesRef.current.size,
          allPendingKeys: Array.from(pendingMessagesRef.current.keys())
        });
        
        if (data.requestId && data.data) {
          const pendingMessage = pendingMessagesRef.current.get(data.requestId);
          log('🟦 Found pending message:', { 
            hasPendingMessage: !!pendingMessage,
            pendingMessage,
            requestId: data.requestId
          });
          
          if (pendingMessage) {
            const aiResponse = data.data.fullResponse || data.data.text || '';
            const userMessage = pendingMessage.userMessage || pendingMessage.message;
            log('🟦 Calling saveToICP with:', {
              userMessage: userMessage,
              aiResponse: aiResponse.substring(0, 100) + '...',
              requestId: data.requestId
            });
            saveToICP(userMessage, aiResponse, data.requestId);
          } else {
            log('🟦 No pending message found for requestId:', data.requestId);
          }
        } else {
          log('🟦 Missing requestId or data in stream_complete:', { 
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
        log('✅ WebSocket connection established:', data.message);
        // Connection is ready - ICP initialization disabled (manual only)
        log('🟦 WebSocket connected, ICP auto-initialization disabled');
        break;
      case 'text':
        log('📝 Received text message:', data);
        // Text messages are handled by the ChatModal component through subscription
        break;
      case 'response':
        log('📝 Received response message:', data);
        // Response messages are handled by the ChatModal component through subscription
        break;
      default:
        log('Unknown message type:', data.type, 'Data:', data);
    }
    
    // Notify all subscribed handlers
    messageHandlersRef.current.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        error('Error in message handler:', error);
      }
    });
  }, [initializeICP, saveToICP]);

  const connectWebSocket = useCallback(() => {
    if (isConnecting || wsRef.current?.readyState === WebSocket.OPEN) {
      log('⚠️ WebSocket already connecting or connected, skipping...');
      return;
    }

    // Only skip if component is unmounted
    if (!isMounted) {
      log('⚠️ Component unmounted, skipping connection attempt');
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
    log('🔌 Connecting to Olivia AI WebSocket:', wsUrl, '(attempt:', connectionAttempts + 1, ')');
    
    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        warn('🔌 Connection timeout, closing WebSocket');
        wsRef.current.close();
      }
    }, CONNECTION_TIMEOUT);
    
    // Create WebSocket connection - Secure proxy only
    if (wsUrl === ENDPOINTS.WEBSOCKET.SECURE_PROXY) {
      if (OPENAI_MICROSERVICE_CONFIG.TOKEN) {
        // Add token as query parameter for secure proxy authentication
        const authenticatedUrl = `${wsUrl}?token=${encodeURIComponent(OPENAI_MICROSERVICE_CONFIG.TOKEN)}`;
        log('🔐 Using secure proxy with authentication');
        wsRef.current = new WebSocket(authenticatedUrl);
      } else {
        // No token available for secure proxy
        error('🚨 No authentication token available for secure proxy');
        setWsError(new Error('Authentication token required for secure proxy'));
        setIsConnecting(false);
        return;
      }
    } else {
      // This should not happen in secure-only mode, but handle gracefully
      warn('⚠️ Attempting to connect to non-secure endpoint in secure-only mode');
      wsRef.current = new WebSocket(wsUrl);
    }

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
        log('✅ WebSocket connected successfully - starting heartbeat');
        
        // Start heartbeat mechanism
        startHeartbeat();
      }, 50);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        log('📨 Received WebSocket message:', data);
        handleWebSocketMessage(data);
      } catch (error) {
        error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      stopHeartbeat(); // Stop heartbeat when connection closes
      
      log('🔌 WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
      
      // Persistent reconnection while component is mounted
      if (isMounted && shouldReconnect && event.code !== 1000) {
        // Calculate delay with exponential backoff (max 30 seconds)
        const delay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000);
        
        log(`🔄 Reconnecting in ${delay/1000}s... (attempt ${connectionAttempts + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }
        }, delay);
      } else if (!shouldReconnect) {
        log('🔌 Reconnection disabled, not attempting to reconnect');
      } else if (!isMounted) {
        log('🔌 Component unmounted, not attempting to reconnect');
      } else if (event.code === 1000) {
        log('🔌 Clean close, not attempting to reconnect');
      }
    };

    wsRef.current.onerror = (error) => {
      error('🚨 Secure WebSocket Proxy Error:', {
        url: wsUrl,
        error: error,
        readyState: wsRef.current?.readyState,
        attempt: connectionAttempts + 1,
        isSecureProxy: wsUrl === ENDPOINTS.WEBSOCKET.SECURE_PROXY,
        message: 'Failed to connect to secure microservice proxy'
      });
      setWsError(error);
      setIsConnected(false);
      setIsConnecting(false);
      
      // In secure-only mode, we only have one endpoint
      if (wsUrl === ENDPOINTS.WEBSOCKET.SECURE_PROXY) {
        error('🚨 Secure proxy connection failed. Please check:');
        error('   - Microservice is running on port 3001');
        error('   - Authentication token is configured');
        error('   - CORS settings allow your origin');
        
        // Retry the same endpoint after delay if should reconnect
        if (isMounted && shouldReconnect) {
          const retryDelay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000);
          log(`🔄 Retrying secure proxy connection in ${retryDelay/1000}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted && shouldReconnect) {
              setConnectionAttempts(prev => prev + 1);
              connectWebSocket();
            }
          }, retryDelay);
        }
      } else {
        // Fallback endpoints handling (for development mode)
        if (currentEndpointIndex < WS_ENDPOINTS.length - 1 && isMounted) {
          log(`🔌 Trying next WebSocket endpoint... (${currentEndpointIndex + 1}/${WS_ENDPOINTS.length - 1})`);
          setCurrentEndpointIndex(prev => prev + 1);
          
          setTimeout(() => {
            if (isMounted && shouldReconnect) {
              connectWebSocket();
            }
          }, 1000);
        } else {
          setCurrentEndpointIndex(0);
          error('🚨 All WebSocket endpoints failed. Service may be down.');
        }
      }
    };
  }, [isConnecting, connectionAttempts, shouldReconnect, isServerUnavailable, currentEndpointIndex, handleWebSocketMessage]);

  const disconnectWebSocket = useCallback(() => {
    log('🔌 Manually disconnecting WebSocket...');
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
    log('✅ WebSocket disconnected cleanly');
  }, [clearAllTimers, stopHeartbeat]);

  // Cancel current streaming response
  const cancelStreamingResponse = useCallback(() => {
    log('🚫 Canceling streaming response');
    
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
        error('Error sending cancel message:', error);
      }
    }
  }, []);



  const sendMessage = useCallback(async (message, conversationHistory = [], searchEnabled = false, imageEnabled = false) => {
    try {
      // Wait for WebSocket to be connected
      await waitForConnection();
    } catch (error) {
      error('❌ Failed to establish WebSocket connection:', error);
      return false;
    }

    // Double-check connection after waiting
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      log('❌ WebSocket still not connected after waiting');
      return false;
    }

    // 🔍 Trading request handling removed - all messages now go to AI
    // This allows the AI to handle trading requests with full context and capability

    const requestId = generateRequestId();
    const userOptions = extractUserOptions();
    
    // Retrieve conversation history from ICP if not provided
    let historyToSend = conversationHistory;
    if (historyToSend.length === 0) {
      historyToSend = await getConversationHistory(10); // Get last 10 message pairs
      log('🟦 Retrieved conversation history for AI context:', {
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
          context_awareness: window.contextAwarenessData || {},
          ...userOptions
        }
      }
    };

    try {
      log('📡 Sending WebSocket message with history:', {
        ...messageData,
        data: {
          ...messageData.data,
          messages: `[${historyToSend.length} history messages]`,
          options: {
            ...messageData.data.options,
            context_awareness: `[${Object.keys(messageData.data.options.context_awareness).length} categories]`
          }
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
      
      log('🟦 Added message to pending:', { 
        requestId,
        message: message.substring(0, 50) + '...',
        pendingCount: pendingMessagesRef.current.size
      });
      
      log('✅ Message sent successfully with requestId:', requestId);
      
      // Return the requestId so upgrade tracking can be done by the caller
      return requestId;
    } catch (error) {
      error('Error sending message:', error);
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
    log('🔌 Manual connection requested');
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

  // Wait for WebSocket connection to be ready
  const waitForConnection = useCallback(() => {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        log('✅ WebSocket already connected');
        resolve(true);
        return;
      }

      log('🔄 WebSocket not connected, attempting to connect...');
      
      // Set up timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        log('⏱️ WebSocket connection timeout (30s)');
        reject(new Error('Connection timeout - unable to connect to AI service'));
      }, 30000); // 30 second timeout

      // Set up connection listener
      const checkConnection = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearTimeout(connectionTimeout);
          log('✅ WebSocket connection established');
          resolve(true);
        } else if (wsRef.current?.readyState === WebSocket.CLOSED || wsRef.current?.readyState === WebSocket.CLOSING) {
          // Connection failed, wait a bit and check again
          setTimeout(checkConnection, 500);
        } else {
          // Still connecting, keep checking
          setTimeout(checkConnection, 100);
        }
      };

      // Trigger connection if not already connecting
      if (!isConnecting && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
        connect();
      }

      // Start checking for connection
      setTimeout(checkConnection, 100);
    });
  }, [isConnecting, connect]);

  // Auto-initialize ICP when context is ready
  useEffect(() => {
    log('🟦 ICP Auto-init useEffect running:', { 
      userData: !!userData, 
      isGuestUser, 
      icpInitialized,
      hasInitializeICP: !!initializeICP
    });
    
    // Force initialization for ANY user state
    if (!icpInitialized) {
      log('🟦 FORCING ICP initialization - user will be created as guest');
      try {
        initializeICP();
      } catch (error) {
        error('🟦 Error calling initializeICP:', error);
      }
    }
  }, [userData, isGuestUser, icpInitialized, initializeICP]);

  // BACKUP: Force ICP init on mount regardless of user state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!icpInitialized) {
        log('🟦 BACKUP: Force ICP init after 2 seconds');
        try {
          initializeICP();
        } catch (error) {
          error('🟦 BACKUP init error:', error);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Enable reconnection on mount and auto-connect
  useEffect(() => {
    setIsMounted(true);
    setShouldReconnect(true);
    
    // Auto-connect when component mounts
    log('🔌 Auto-connecting on mount...');
    const timeoutId = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    }, 100); // Small delay to ensure state is set
    
    return () => {
      log('🔌 Component unmounting, cleaning up WebSocket...');
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

  // Expose initializeICP globally for debugging
  useEffect(() => {
    window.forceICPInit = () => {
      log('🟦 MANUAL: Force ICP initialization from console');
      initializeICP();
    };
    
    return () => {
      delete window.forceICPInit;
    };
  }, [initializeICP]);

  // Debug function to show current configuration
  const getConnectionInfo = useCallback(() => {
    return {
      mode: 'secure-only',
      primaryEndpoint: ENDPOINTS.WEBSOCKET.SECURE_PROXY,
      hasAuthToken: !!OPENAI_MICROSERVICE_CONFIG.TOKEN,
      microserviceUrl: OPENAI_MICROSERVICE_CONFIG.URL,
      currentStatus: {
        isConnected,
        isConnecting,
        connectionAttempts,
        currentEndpointIndex,
        wsError: wsError?.message || null
      },
      fallbackEndpoints: FALLBACK_ENDPOINTS
    };
  }, [isConnected, isConnecting, connectionAttempts, currentEndpointIndex, wsError]);

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
    getConnectionInfo, // Debug function
    // ICP Storage
    icpInitialized,
    icpUser,
    conversationId,
    initializeICP,
    saveToICP,
    getConversationHistory,
    clearConversationId
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}; 