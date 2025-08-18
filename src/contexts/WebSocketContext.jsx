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

const MAX_RETRIES = 10; // Increased for persistence
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

export const WebSocketProvider = ({ children }) => {
  console.log('🟦 WebSocketProvider mounting...');
  
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
  
  // Use the EXISTING conversation ID from the canister - this is the key fix!
  const [conversationId, setConversationId] = useState(() => {
    // Force use the existing conversation ID from your canister
    const existingConversationId = "conv_1754571813996_wga2cvd7j";
    console.log('🟦 FORCING existing conversation ID from canister:', existingConversationId);
    localStorage.setItem('olivia_conversation_id', existingConversationId);
    return existingConversationId;
  });
  
  // Debug ICP state changes
  useEffect(() => {
    console.log('🟦 ICP State Changed:', { icpInitialized, hasIcpUser: !!icpUser, hasConversationId: !!conversationId });
  }, [icpInitialized, icpUser, conversationId]);
  
  const { userData, userAuthenticated, isGuestUser } = useAuth();

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
      
      // Skip connection test in development - just proceed with user creation
      console.log('🟦 Skipping ICP connection test in development - proceeding with user creation');
      
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

  // Save message to ICP with privacy filtering
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
    
    try {
      console.log('🔒 Processing messages through privacy filter...');
      
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
        console.log('🔒 Privacy protection applied:', {
          userMessageHashed: privacyResult.privacy.userMessageHashed,
          aiResponseHashed: privacyResult.privacy.aiResponseHashed,
          userReasons: privacyResult.privacy.userAnalysis?.reasons || [],
          aiReasons: privacyResult.privacy.aiAnalysis?.reasons || []
        });
      } else {
        console.log('🔒 No sensitive content detected, messages stored as-is');
      }
      
      // Check if ICP is ready for storage
      if (!icpInitialized || !icpUser || !conversationId) {
        console.log('🟦 ICP not ready, skipping storage (but privacy analysis completed)', {
          icpInitialized,
          hasIcpUser: !!icpUser,
          hasConversationId: !!conversationId,
          privacyProcessed: true
        });
        return;
      }
      
      console.log('🟦 Saving processed message to ICP:', { 
        originalUserLength: userMessage?.length || 0,
        finalUserLength: finalUserMessage?.length || 0,
        originalAiLength: aiResponse?.length || 0,
        finalAiLength: finalAiResponse?.length || 0,
        requestId 
      });
      
      // Validate messages before saving
      if (!finalUserMessage || !finalAiResponse) {
        console.error('🟦 Cannot save to ICP: missing user or AI message', {
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
        console.log('🟦 Message saved to ICP successfully:', result.message);
        
        // Remove from pending messages
        pendingMessagesRef.current.delete(requestId);
      } else {
        console.error('🟦 Failed to save message to ICP:', result.error);
      }
      
    } catch (error) {
      console.error('🔒 Error in privacy processing or ICP save:', error);
      
      // Fallback: if ICP is ready but privacy processing failed, save original messages
      if (icpInitialized && icpUser && conversationId) {
        try {
          console.log('🟦 Fallback: saving original messages due to privacy processing error');
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
          console.error('🟦 Fallback save also failed:', fallbackError);
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
            const userMessage = pendingMessage.userMessage || pendingMessage.message;
            console.log('🟦 Calling saveToICP with:', {
              userMessage: userMessage,
              aiResponse: aiResponse.substring(0, 100) + '...',
              requestId: data.requestId
            });
            saveToICP(userMessage, aiResponse, data.requestId);
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
        // Connection is ready - ICP initialization disabled (manual only)
        console.log('🟦 WebSocket connected, ICP auto-initialization disabled');
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

    // 🔍 Check if message is a trading request BEFORE sending to WebSocket
    try {
      const tradingResult = await aiService.handleTradingRequest(message);
      if (tradingResult) {
        console.log('💱 Trading request detected:', tradingResult);
        
        const requestId = generateRequestId();
        
        // Add to pending messages first
        pendingMessagesRef.current.set(requestId, {
          requestId,
          message,
          timestamp: Date.now()
        });
        
        console.log('🟦 Added trading message to pending:', {
          requestId,
          message,
          pendingCount: pendingMessagesRef.current.size
        });

        // Generate a mock response for trading
        const tradingResponse = {
          type: 'stream_complete',
          requestId: requestId,
          data: {
            fullResponse: tradingResult.oliviaMessage,
            urlSources: { annotations: [] }
          }
        };

        // Trigger the response handlers by directly calling the message handler
        setTimeout(() => {
          // Directly call the WebSocket message handler with the parsed data
          handleWebSocketMessage(tradingResponse);
        }, 500); // Small delay to simulate processing

        return true;
      }
    } catch (error) {
      console.error('🔍 Trading detection error:', error);
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
          context_awareness: window.contextAwarenessData || {},
          ...userOptions
        }
      }
    };

    try {
      console.log('📡 Sending WebSocket message with history:', {
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

  // Auto-initialize ICP when context is ready
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
        initializeICP();
      } catch (error) {
        console.error('🟦 Error calling initializeICP:', error);
      }
    }
  }, [userData, isGuestUser, icpInitialized, initializeICP]);

  // BACKUP: Force ICP init on mount regardless of user state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!icpInitialized) {
        console.log('🟦 BACKUP: Force ICP init after 2 seconds');
        try {
          initializeICP();
        } catch (error) {
          console.error('🟦 BACKUP init error:', error);
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

  // Expose initializeICP globally for debugging
  useEffect(() => {
    window.forceICPInit = () => {
      console.log('🟦 MANUAL: Force ICP initialization from console');
      initializeICP();
    };
    
    return () => {
      delete window.forceICPInit;
    };
  }, [initializeICP]);

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