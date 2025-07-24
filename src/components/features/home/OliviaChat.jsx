import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useAccountUpgrade } from '../../../hooks/useAccountUpgrade';
import { v4 as uuidv4 } from 'uuid';
import ChatInput from '../../ui/ChatInput';
import ChatMessages from '../../ui/ChatMessages';
import useAudioWebSocket from '../../../hooks/useAudioWebSocket';
import { chatService } from '../../../api';
import { getExtraData, setWebsocketRunning, clearExtraData } from '../../../utils/olivia';

const OliviaChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [processingMessage, setProcessingMessage] = useState(null);
  const chatInputRef = useRef(null);
  const isProcessingRef = useRef(false);
  const { userData, isGuestUser } = useAuth();
  
  // Debug user state
  useEffect(() => {
    console.log('👤 User state in OliviaChat:', { userData, isGuestUser });
  }, [userData, isGuestUser]);
  const { isConnected, isConnecting, sendMessage, currentAction, actionStatus, isStreamingResponse: wsIsStreamingResponse, cancelStreamingResponse, connect, disconnect, wsError, isServerUnavailable, currentEndpointIndex, wsEndpoints } = useWebSocket();
  
  // Import upgrade tracking hook
  const { trackMessage } = useAccountUpgrade();
  
  // New streaming states
  const [useStreamingMode, setUseStreamingMode] = useState(true);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [imageEnabled, setImageEnabled] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  // Expose sendChatMessage function to window for use by hooks
  useEffect(() => {
    console.log('🪟 Setting up window.sendChatMessage in OliviaChat');
    
    window.sendChatMessage = ({ message, action }) => {
      console.log('🎬 window.sendChatMessage called with:', { message, action });
      
      const assistantMessage = {
        id: uuidv4(),
        text: message,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'text',
        action_type: action ? 'action' : null,
        sub_action_type: action ? action.type : null,
        meta: action ? action.meta : null,
        isComplete: true,
        typingComplete: true
      };
      
      console.log('💬 Adding assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    };
    
    return () => {
      console.log('🧹 Cleaning up window.sendChatMessage');
      delete window.sendChatMessage;
    };
  }, []);

  // Function to update chat history on the server
  const updateServerChatHistory = useCallback(async (updatedMessages) => {
    if (userData?.user_id && userData?.user_id !== 'guest_user') {
      try {
        const updateData = {
          chat_history: updatedMessages
        };
        await chatService.updateChatHistory(userData.user_id, updateData);
      } catch (error) {
        console.error("Failed to update chat history on server:", error);
      }
    }
  }, [userData?.user_id]);

  // Handle cancel streaming response
  const handleCancelStreaming = useCallback(() => {
    console.log('🚫 User canceled streaming response');
    setIsStreamingResponse(false);
    setProcessingMessage(null);
    setIsWarmingUp(false);
    if (cancelStreamingResponse) {
      cancelStreamingResponse();
    }
  }, [cancelStreamingResponse]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (userData?.user_id && userData?.user_id !== 'guest_user') {
        try {
          const data = await chatService.getChatHistory(userData.user_id);
          if (data && data.chat_history && Array.isArray(data.chat_history)) {
            setMessages(data.chat_history);
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    loadChatHistory();
  }, [userData?.user_id]);

  // Connect WebSocket when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      console.log('🔌 Connecting WebSocket on home page');
      connect();
    }
    
    return () => {
      console.log('🔌 Disconnecting WebSocket on home page unmount');
      disconnect();
    };
  }, [isConnected, isConnecting, connect, disconnect]);

  // Handle warming up state when component mounts
  useEffect(() => {
    console.log('🔥 OliviaChat mounted - immediately showing thinking indicator');
    setIsWarmingUp(true);
    setIsStreamingResponse(true);
    
    // Add an immediate startup message
    const startupMessage = {
      id: 'startup_' + Date.now(),
      text: "Starting up Olivia AI...",
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      type: 'text',
      isStartup: true
    };
    
    setMessages([startupMessage]);
    
    // Safety timeout to clear warming up state after 15 seconds
    const warmupTimeout = setTimeout(() => {
      console.log('🔥 Warmup timeout - clearing warming up state');
      setIsWarmingUp(false);
    }, 15000);
    
    return () => {
      clearTimeout(warmupTimeout);
    };
  }, []);

  // Clear warming up state only when we actually receive a meaningful response
  useEffect(() => {
    if (isWarmingUp && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'assistant' && !lastMessage.isStartup) {
        console.log('🔥 Clearing warming up state - got real response');
        setIsWarmingUp(false);
      }
    }
  }, [messages, isWarmingUp]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case "processing":
        setProcessingMessage(data.message);
        setWebsocketRunning(true);
        isProcessingRef.current = true;
        break;
      case "complete":
        setProcessingMessage(null);
        setWebsocketRunning(false);
        isProcessingRef.current = false;
        setIsWarmingUp(false);
        break;
      case "message":
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, data.data];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        });
        break;
      default:
        // Handle other message types
        break;
    }
  };

  // Handle streaming WebSocket messages
  const handleStreamingWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'connection':
        console.log('WebSocket connection established:', data.message);
        break;
      
      case 'stream_chunk':
        setIsStreamingResponse(true);
        setIsWarmingUp(false);
        handleStreamChunk(data);
        break;
      
      case 'stream_complete':
        setIsStreamingResponse(false);
        setIsWarmingUp(false);
        handleStreamComplete(data);
        break;
      
      case 'explanation_chunk':
        setIsStreamingResponse(true);
        setIsWarmingUp(false);
        handleExplanationChunk(data);
        break;
      
      case 'explanation_complete':
        setIsStreamingResponse(false);
        setIsWarmingUp(false);
        handleExplanationComplete(data);
        break;
      
      case 'event':
        handleEvent(data);
        break;
      
      default:
        console.log('Unknown message type:', data.type, 'Full data:', data);
    }
  }, []);

  // Handle streaming chunks
  const handleStreamChunk = useCallback((data) => {
    const { requestId, data: chunkData } = data;
    const text = chunkData.text || '';
    
    if (text) {
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'assistant' && !lastMessage.isExplanation) {
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 
              ? { ...msg, text: msg.text + text }
              : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          const newAssistantMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: text, 
            timestamp: new Date().toISOString(),
            type: 'text'
          };
          const updatedMessages = [...newMessages, newAssistantMessage];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        }
      });
    }
  }, [updateServerChatHistory]);

  // Handle stream completion
  const handleStreamComplete = useCallback((data) => {
    const { requestId, data: completeData } = data;
    
    if (completeData && completeData.fullResponse) {
      const shouldIncludeSources = completeData.urlSources?.annotations && Array.isArray(completeData.urlSources.annotations);
      
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'assistant' && !lastMessage.isExplanation) {
          const updatedMessage = {
            ...lastMessage, 
            text: completeData.fullResponse, 
            timestamp: new Date().toISOString(),
            sources: shouldIncludeSources ? completeData.urlSources.annotations : null,
            isComplete: true
          };
          
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 ? updatedMessage : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          const newMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: completeData.fullResponse, 
            timestamp: new Date().toISOString(),
            type: 'text',
            sources: shouldIncludeSources ? completeData.urlSources.annotations : null,
            isComplete: true
          };
          
          const updatedMessages = [...newMessages, newMessage];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        }
      });
    }
    
    setIsStreamingResponse(false);
    setIsWarmingUp(false);
  }, [updateServerChatHistory]);

  // Handle explanation chunks
  const handleExplanationChunk = useCallback((data) => {
    const { data: chunkData } = data;
    const text = chunkData.text || '';
    
    console.log('🟦 Explanation chunk received:', { text: text.substring(0, 100), length: text.length });
    
    if (text) {
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'assistant' && lastMessage.isExplanation && !lastMessage.completed) {
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 
              ? { ...msg, text: msg.text + text }
              : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          const newExplanationMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: text, 
            timestamp: new Date().toISOString(),
            type: 'text',
            isExplanation: true,
            completed: false
          };
          console.log('🟦 Creating new explanation message:', newExplanationMessage);
          const updatedMessages = [...newMessages, newExplanationMessage];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        }
      });
    }
  }, [updateServerChatHistory]);

  // Handle explanation completion
  const handleExplanationComplete = useCallback((data) => {
    const { data: explanationData } = data;
    
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const lastMessage = newMessages[newMessages.length - 1];
      
      if (lastMessage && lastMessage.sender === 'assistant' && lastMessage.isExplanation && !lastMessage.completed) {
        const finalContent = explanationData.fullResponse || lastMessage.text;
        const updatedMessages = newMessages.map((msg, index) => 
          index === newMessages.length - 1 
            ? { ...msg, text: finalContent, completed: true, timestamp: new Date().toISOString() }
            : msg
        );
        updateServerChatHistory(updatedMessages);
        return updatedMessages;
      } else {
        const explanationText = explanationData.fullResponse;
        if (explanationText) {
          const newExplanationMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: explanationText, 
            timestamp: new Date().toISOString(),
            type: 'text',
            isExplanation: true,
            completed: true
          };
          const updatedMessages = [...newMessages, newExplanationMessage];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        }
        return newMessages;
      }
    });
    
    setIsWarmingUp(false);
  }, [updateServerChatHistory]);

  // Handle action events
  const handleEvent = useCallback((data) => {
    const { eventType, data: eventData } = data;
    console.log('Event received:', { eventType, eventData });
  }, []);

  // Audio WebSocket hook
  const { sendAudio, disconnect: disconnectAudio } = useAudioWebSocket(handleWebSocketMessage);
  
  // WebSocket streaming hook
  const { subscribe: subscribeToStreaming } = useWebSocket();
  
  // Subscribe to streaming messages
  useEffect(() => {
    const unsubscribe = subscribeToStreaming(handleStreamingWebSocketMessage);
    return unsubscribe;
  }, [subscribeToStreaming, handleStreamingWebSocketMessage]);

  useEffect(() => {
    return () => {
      disconnectAudio();
      setWebsocketRunning(false);
      isProcessingRef.current = false;
      setIsStreamingResponse(false);
      setIsWarmingUp(false);
    };
  }, [disconnectAudio]);

  // Handle extra data messages - simplified since ICP setup now uses dedicated route
  useEffect(() => {
    const extraData = getExtraData();
    if (extraData?.sendMessage) {
      const message = extraData.message;
      console.log('🎯 Extra data message detected:', message);
      
      if (isProcessingRef.current) {
        chatInputRef.current?.setMessage(message);
        chatInputRef.current?.focus();
      } else {
        handleSendMessage(message);
      }
      
      // Clear the extra data after using it to prevent repeated sends
      setTimeout(() => {
        clearExtraData();
      }, 100);
    }
  }, [isConnected, messages.length]); // Run when connected or messages change

  // Show instant greeting when chat opens, then send hidden message in background
  useEffect(() => {
    console.log('🔍 Greeting useEffect triggered:', { 
      messagesLength: messages.length, 
      hasMessages: messages.length > 0,
      firstMessage: messages[0],
      isConnected,
      userData: userData?.user_id
    });
    
    const userId = userData?.user_id || 'guest_user';
    const hasHadInitialMessage = localStorage.getItem(`olivia_initial_message_sent_${userId}`);
    const extraData = getExtraData();
    
    console.log('🔍 Greeting conditions:', {
      userId,
      hasHadInitialMessage,
      hasExtraData: !!extraData?.sendMessage,
      messagesLength: messages.length,
      firstMessageIsStartup: messages[0]?.isStartup
    });
    
    // Skip automatic search if there's other extra data waiting
    if (extraData?.sendMessage) {
      console.log('🎯 Skipping automatic search - extra data message takes priority');
      return;
    }
    
    // Show instant greeting if we haven't sent the initial message yet
    if (messages.length === 1 && messages[0]?.isStartup && !hasHadInitialMessage) {
      console.log('💬 Showing instant greeting message...');
      
      const greetingMessage = {
        id: uuidv4(),
        text: "Hey there, I've got some interesting stuff I've found! Let me show you.",
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'text',
        isComplete: true,
        typingComplete: true
      };
      
      setMessages([greetingMessage]);
      updateServerChatHistory([greetingMessage]);
      
      // Show thinking indicator after greeting message and send hidden message
      setTimeout(async () => {
        setIsStreamingResponse(true); // Show thinking indicator
        console.log('🤔 Thinking indicator shown, preparing to send hidden message...');
        console.log('🔍 WebSocket status:', { isConnected, isServerUnavailable });
        
        if (isConnected) {
          console.log('✅ WebSocket ready, sending hidden message immediately...');
          
          const hiddenSearchMessage = "hey who are you and what day is it";
          
          try {
            const conversationHistory = [
              { role: 'assistant', content: greetingMessage.text }
            ];
            
            console.log('📤 Sending message:', hiddenSearchMessage);
            const success = await sendMessage(hiddenSearchMessage, conversationHistory, true, false);
            
            if (success) {
              console.log('✅ Hidden message sent successfully!');
              localStorage.setItem(`olivia_initial_message_sent_${userId}`, 'true');
            } else {
              console.error('❌ Hidden message failed to send');
              setIsStreamingResponse(false); // Stop thinking if failed
            }
          } catch (error) {
            console.error('❌ Error sending hidden message:', error);
            setIsStreamingResponse(false); // Stop thinking if error
          }
        } else {
          console.log('⚠️ WebSocket not connected yet, waiting...');
          
          // Wait up to 3 seconds for connection
          let attempts = 0;
          const maxAttempts = 6; // 3 seconds
          
          while (attempts < maxAttempts && !isConnected) {
            console.log(`⏳ Waiting for connection... attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
          
          if (isConnected) {
            console.log('✅ Connection established after waiting, sending message...');
            
            const hiddenSearchMessage = "hey who are you and what day is it";
            
            try {
              const conversationHistory = [
                { role: 'assistant', content: greetingMessage.text }
              ];
              
              const success = await sendMessage(hiddenSearchMessage, conversationHistory, true, false);
              
              if (success) {
                console.log('✅ Hidden message sent after waiting!');
                localStorage.setItem(`olivia_initial_message_sent_${userId}`, 'true');
              } else {
                console.error('❌ Hidden message failed after waiting');
                setIsStreamingResponse(false);
              }
            } catch (error) {
              console.error('❌ Error sending message after waiting:', error);
              setIsStreamingResponse(false);
            }
          } else {
            console.error('❌ WebSocket never connected, stopping thinking indicator');
            setIsStreamingResponse(false);
          }
        }
      }, 500);
    }
  }, [messages.length, messages, isConnected, sendMessage, userData, updateServerChatHistory]);

  const handleSendMessage = useCallback(async (message) => {
    console.log('🚀 Sending message:', message);
    
    setIsStreamingResponse(true);

    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateServerChatHistory(updatedMessages);

    try {
      const conversationHistory = messages
        .filter(msg => !msg.isExplanation)
        .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));
      
      const sent = await sendMessage(message, conversationHistory, searchEnabled, imageEnabled);
      
      if (!sent) {
        throw new Error('Failed to send message - WebSocket not connected');
      }
      
      if (isGuestUser) {
        trackMessage();
      }

      setTimeout(() => {
        console.log('⏰ Timeout: No response received, clearing streaming state');
        setIsStreamingResponse(false);
      }, 30000);
      
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      
      const errorMessage = {
        id: uuidv4(),
        text: 'Sorry, there was an error sending your message. Please check your connection and try again.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      const errorMessages = [...updatedMessages, errorMessage];
      setMessages(errorMessages);
      updateServerChatHistory(errorMessages);
      
      setIsStreamingResponse(false);
    }
  }, [messages, searchEnabled, imageEnabled, updateServerChatHistory, sendMessage, isGuestUser, trackMessage]);

  const handleAudioRecorded = (audioBlob) => {
    const userMessage = {
      type: 'audio',
      audioBlob,
      sender: 'user',
      showText: false,
      text: "Audio message",
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateServerChatHistory(updatedMessages);
    sendAudio(audioBlob, "Manual");
  };

  const handleAgentMessage = (message, agent) => {
    const userMessage = {
      type: 'text',
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateServerChatHistory(updatedMessages);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Olivia-ai-LOGO.png"
              alt="Olivia AI"
              className="w-8 h-8"
            />
            <h2 className="text-white font-semibold text-lg">Chat with Olivia AI</h2>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/30 text-green-300 rounded-full text-xs backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/30 text-red-300 rounded-full text-xs backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                {isServerUnavailable ? 'Server Unavailable' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </div>
            )}
            <button
              onClick={onClose}
              className="ml-2 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-hidden p-4">
        <ChatMessages
          messages={messages}
          isBotResponding={wsIsStreamingResponse || isStreamingResponse}
          processingMessage={processingMessage}
          onUpdateMessage={(index, updates) => {
            const updatedMessages = [...messages];
            updatedMessages[index] = { ...updatedMessages[index], ...updates };
            setMessages(updatedMessages);
            updateServerChatHistory(updatedMessages);
          }}
          useStreamingMode={useStreamingMode}
          isStreamingResponse={wsIsStreamingResponse || isStreamingResponse}
          currentAction={currentAction}
          actionStatus={actionStatus}
          isWarmingUp={isWarmingUp}
        />
      </div>

      {/* Input */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-4">
        <ChatInput
          ref={chatInputRef}
          onSendMessage={handleSendMessage}
          onAudioRecorded={handleAudioRecorded}
          onAgentMessage={handleAgentMessage}
          onCancel={handleCancelStreaming}
          disabled={wsIsStreamingResponse || isStreamingResponse}
        />
      </div>
    </div>
  );
};

export default OliviaChat; 