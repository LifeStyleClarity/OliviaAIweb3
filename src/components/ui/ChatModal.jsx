import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useChatContext } from '../../contexts/ChatContext';
import { getExtraData, setWebsocketRunning } from '../../utils/olivia';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import useAudioWebSocket from '../../hooks/useAudioWebSocket';
import { chatService } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { v4 as uuidv4 } from 'uuid';
import StreamingLoadingIndicator from './StreamingLoadingIndicator';
import SourcesDrawer from './SourcesDrawer';
import { getFastCryptoUpdate, getCryptoInsights } from '../../utils/cryptoNewsCache';

const ChatModal = () => {
  const { isOpen, setIsOpen } = useChatContext();
  const [messages, setMessages] = useState([]);
  const [processingMessage, setProcessingMessage] = useState(null);
  const chatInputRef = useRef(null);
  const isProcessingRef = useRef(false);
  const { userData, isGuestUser } = useAuth();
  const { isConnected, isConnecting, sendMessage, currentAction, actionStatus, isStreamingResponse: wsIsStreamingResponse, cancelStreamingResponse, connect, disconnect, wsError, isServerUnavailable, currentEndpointIndex, wsEndpoints } = useWebSocket();
  
  // New streaming states
  const [useStreamingMode, setUseStreamingMode] = useState(true); // Toggle between old and new system
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [imageEnabled, setImageEnabled] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false); // For first-time connection warming

  // Function to update chat history on the server
  const updateServerChatHistory = useCallback(async (updatedMessages) => {
    if (userData?.user_id && userData?.user_id !== 'guest_user') {
      try {
        // Create update data object with the full message structure
        const updateData = {
          chat_history: updatedMessages
        };

        // Update chat history on the server
        await chatService.updateChatHistory(userData.user_id, updateData);
      } catch (error) {
        console.error("Failed to update chat history on server:", error);
        // Continue silently - don't crash the app for save failures
      }
    }
  }, [userData?.user_id]);

  // Handle cancel streaming response
  const handleCancelStreaming = useCallback(() => {
    console.log('🚫 User canceled streaming response');
    
    // Stop local streaming states
    setIsStreamingResponse(false);
    setProcessingMessage(null);
    setIsWarmingUp(false);
    
    // Cancel WebSocket streaming
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
          //console.log("USER CHAT DATA: ", data);

          if (data && data.chat_history && Array.isArray(data.chat_history)) {
            // Use the full message structure directly
            setMessages(data.chat_history);
            
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
          // Set empty messages array as fallback
          setMessages([]);
        }
      } else {
        // For guest users or when no user_id, start with empty messages
        setMessages([]);
      }
    };

    loadChatHistory();
  }, [userData?.user_id]);





  // Connect WebSocket when modal opens, disconnect when it closes
  useEffect(() => {
    let timeoutId;
    
    if (isOpen && !isConnected && !isConnecting) {
      console.log('🔌 Connecting WebSocket when modal opens');
      // Small delay to prevent rapid open/close cycles
      timeoutId = setTimeout(() => {
        connect();
      }, 100);
    } else if (!isOpen && isConnected) {
      console.log('🔌 Disconnecting WebSocket when modal closes');
      disconnect();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, isConnected, isConnecting, connect, disconnect]);

  // Handle warming up state when chat is first opened
  useEffect(() => {
    if (isOpen) {
      setIsWarmingUp(true);
      // Also immediately set streaming response to show thinking indicator
      setIsStreamingResponse(true);
    } else {
      setIsWarmingUp(false);
      setIsStreamingResponse(false);
    }
  }, [isOpen]);

  // Clear warming up state only when we actually receive a response
  useEffect(() => {
    if (isWarmingUp && messages.length > 0) {
      // Check if the last message is from the assistant (AI response)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'assistant') {
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
        setIsWarmingUp(false); // Clear warming up state when processing is complete
        break;
      case "message":
        // Add bot message to the messages state using a function update
        // to ensure we're using the latest messages state
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages, data.data];
          // Update server chat history with the new messages
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        });
        break;
      default:
      //console.log("Unknown message type:", data.type);
    }
  };

  // Handle streaming WebSocket messages
  const handleStreamingWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'connection':
        console.log('WebSocket connection established:', data.message);
        // Clear warming up state when connection is established
        setIsWarmingUp(false);
        break;
      
      case 'stream_chunk':
        handleStreamChunk(data);
        break;
      
      case 'stream_complete':
        handleStreamComplete(data);
        break;
      
      case 'explanation_chunk':
        handleExplanationChunk(data);
        break;
      
      case 'explanation_complete':
        handleExplanationComplete(data);
        break;
      
      case 'event':
        handleEvent(data);
        break;
      
      default:
        console.log('Unknown message type:', data.type, 'Full data:', data);
    }
  }, []);

  // Handle action events
  const handleEvent = useCallback((data) => {
    const { eventType, data: eventData } = data;
    
    console.log('Event received:', { eventType, eventData });
    
    switch (eventType) {
      case 'action_start':
        if (eventData.action === 'web_search') {
          // Action state is handled in WebSocketContext
        }
        break;
      
      case 'action_complete':
        if (eventData.status === 'completed') {
          // Action state is handled in WebSocketContext
        }
        break;
      
      default:
        console.log('Unknown event type:', eventType);
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
        
        // Only update if the last message is a regular assistant message (not explanation)
        if (lastMessage && lastMessage.sender === 'assistant' && !lastMessage.isExplanation) {
          // Update existing assistant message
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 
              ? { ...msg, text: msg.text + text }
              : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          // Create new assistant message if none exists or last message is explanation
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
    
    console.log('Stream Complete received:', { requestId, completeData });
    
    // Add the full response to chat history if available
    if (completeData && completeData.fullResponse) {
      // Debug: Log the complete data structure
      console.log('Complete data structure:', JSON.stringify(completeData, null, 2));
      
      // Check if sources should be included - be more flexible with the condition
      const shouldIncludeSources = completeData.urlSources?.annotations && Array.isArray(completeData.urlSources.annotations);
      
      // Debug: Log source information
      console.log('Should include sources:', shouldIncludeSources);
      console.log('URL Sources:', completeData.urlSources);
      
      // Update the last assistant message with the complete response
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.sender === 'assistant' && !lastMessage.isExplanation) {
          const updatedMessage = {
            ...lastMessage, 
            text: completeData.fullResponse, 
            timestamp: new Date().toISOString(),
            sources: shouldIncludeSources ? completeData.urlSources.annotations : null,
            isComplete: true // Mark as complete for video detection
          };
          
          // Update the existing assistant message with the complete response and sources
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 ? updatedMessage : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          // Create new assistant message if none exists
          const newMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: completeData.fullResponse, 
            timestamp: new Date().toISOString(),
            type: 'text',
            sources: shouldIncludeSources ? completeData.urlSources.annotations : null,
            isComplete: true // Mark as complete for video detection
          };
          
          const updatedMessages = [...newMessages, newMessage];
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        }
      });
    }
    
    // Clear the loading and warming up state when response is complete
    setIsStreamingResponse(false);
    setIsWarmingUp(false);
  }, [updateServerChatHistory]);

  // Handle explanation chunks
  const handleExplanationChunk = useCallback((data) => {
    const { data: chunkData } = data;
    const text = chunkData.text || '';
    
    if (text) {
      // Update the explanation in real-time like stream chunks
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        
        // Check if the last message is an explanation message being streamed
        if (lastMessage && lastMessage.sender === 'assistant' && lastMessage.isExplanation && !lastMessage.completed) {
          // Update existing explanation message
          const updatedMessages = newMessages.map((msg, index) => 
            index === newMessages.length - 1 
              ? { ...msg, text: msg.text + text }
              : msg
          );
          updateServerChatHistory(updatedMessages);
          return updatedMessages;
        } else {
          // Create new explanation message if none exists
          const newExplanationMessage = { 
            id: Date.now() + Math.random(),
            sender: 'assistant', 
            text: text, 
            timestamp: new Date().toISOString(),
            type: 'text',
            isExplanation: true,
            completed: false // Mark as streaming
          };
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
    
    // Mark the last explanation message as completed
    setMessages(prevMessages => {
      const newMessages = [...prevMessages];
      const lastMessage = newMessages[newMessages.length - 1];
      
      if (lastMessage && lastMessage.sender === 'assistant' && lastMessage.isExplanation && !lastMessage.completed) {
        // Update the existing explanation message with the complete response and mark as completed
        const finalContent = explanationData.fullResponse || lastMessage.text;
        const updatedMessages = newMessages.map((msg, index) => 
          index === newMessages.length - 1 
            ? { ...msg, text: finalContent, completed: true, timestamp: new Date().toISOString() }
            : msg
        );
        updateServerChatHistory(updatedMessages);
        return updatedMessages;
      } else {
        // Fallback: Add the complete explanation as a new message if no streaming message exists
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
    
    // Clear the warming up state when explanation is complete
    setIsWarmingUp(false);
  }, [updateServerChatHistory]);

  // Audio WebSocket hook (still used for voice messages)
  const { sendAudio, disconnect: disconnectAudio } = useAudioWebSocket(handleWebSocketMessage);
  
  // WebSocket streaming hook for enhanced chat
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
    };
  }, [disconnectAudio]);

  // Handle sendMessage flag when modal opens
  useEffect(() => {
    if (isOpen && getExtraData()?.sendMessage) {
      const message = getExtraData().message;
      if (isProcessingRef.current) {
        // If currently processing a message, set in input box
        chatInputRef.current?.setMessage(message);
        chatInputRef.current?.focus();
      } else {
        // If not processing, send directly
        handleSendMessage(message);
      }
    }
  }, [isOpen]);

  // Send secret proactive message when modal opens for the first time ONLY
  useEffect(() => {
    // Use 'guest_user' as fallback if userData is not loaded yet
    const userId = userData?.user_id || 'guest_user';
    const hasHadInitialCryptoNews = localStorage.getItem(`olivia_crypto_news_sent_${userId}`);
    
    // FOR TESTING: Reset the first message flag - uncomment this line to reset
    // localStorage.removeItem(`olivia_crypto_news_sent_${userId}`);
    
    if (isOpen && messages.length === 0 && !hasHadInitialCryptoNews && !isProcessingRef.current) {
      console.log('✅ Adding first message to chat');
      
      let greetingMessage;
      
      // Check if server is unavailable
      if (isServerUnavailable) {
        greetingMessage = {
          id: uuidv4(),
          text: "Hi there! I'm currently having trouble connecting to my servers. Please try again in a few minutes. In the meantime, you can still explore your portfolio and trading features!",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'text'
        };
      } else if (isConnected) {
        greetingMessage = {
          id: uuidv4(),
          text: "Hey there, I've got some interesting stuff I've found! Let me show you.",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'text'
        };
      } else {
        // Still connecting
        greetingMessage = {
          id: uuidv4(),
          text: "Hey there! I'm connecting to my servers to get you the latest crypto insights...",
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          type: 'text'
        };
      }
      
      // Add only the greeting message to chat (NO hidden user message visible)
      setMessages([greetingMessage]);
      updateServerChatHistory([greetingMessage]);
      
      // Don't mark as sent yet - wait for the search to complete
      // localStorage.setItem(`olivia_crypto_news_sent_${userData?.user_id || 'guest'}`, 'true');
    }
  }, [isOpen, isConnected, isServerUnavailable, messages.length, sendMessage, updateServerChatHistory, userData]);

  // Send search message when connection is established and we have the greeting message
  useEffect(() => {
    const userId = userData?.user_id || 'guest_user';
    const hasHadInitialCryptoNews = localStorage.getItem(`olivia_crypto_news_sent_${userId}`);
    
    if (isOpen && isConnected && !isServerUnavailable && messages.length === 1 && !hasHadInitialCryptoNews) {
      const greetingMessage = messages[0];
      
      if (greetingMessage.sender === 'assistant') {
        console.log('🔍 Connection established, sending search message...');
        
        const hiddenSearchMessage = "search @https://crypto.news/ what's happening in crypto right now AND give me 4 key points";
        
        const sendSearch = async () => {
          try {
            // Add a small delay to ensure WebSocket is fully ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Format conversation history correctly for the WebSocket
            const conversationHistory = [
              { role: 'assistant', content: greetingMessage.text }
            ];
            
                         console.log('🔍 Sending hidden search message:', hiddenSearchMessage);
             const success = await sendMessage(hiddenSearchMessage, conversationHistory, true, false);
             
             if (success) {
               console.log('✅ Search message sent successfully');
               // Mark that crypto news has been sent for this user
               localStorage.setItem(`olivia_crypto_news_sent_${userData?.user_id || 'guest'}`, 'true');
             } else {
               console.log('⚠️ First attempt failed, retrying in 1000ms...');
               await new Promise(resolve => setTimeout(resolve, 1000));
               const retrySuccess = await sendMessage(hiddenSearchMessage, conversationHistory, true, false);
               if (retrySuccess) {
                 localStorage.setItem(`olivia_crypto_news_sent_${userData?.user_id || 'guest'}`, 'true');
               }
             }
          } catch (error) {
            console.error('Failed to send search message:', error);
          }
        };
        
        sendSearch();
      }
    }
  }, [isOpen, isConnected, isServerUnavailable, messages.length, messages, sendMessage, userData]);

  const handleSendMessage = useCallback(async (message) => {
    console.log('🚀 Sending message:', message);
    
    // Set loading state immediately for instant feedback
    setIsStreamingResponse(true);

    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Update server chat history
    updateServerChatHistory(updatedMessages);

    // Send message through WebSocket using the streaming hook format
    try {
      // Get conversation history (excluding explanation messages)
      const conversationHistory = messages
        .filter(msg => !msg.isExplanation)
        .map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));
      
      console.log('📝 Conversation history:', conversationHistory);
      
      // Send via WebSocket using the context
      const sent = await sendMessage(message, conversationHistory, searchEnabled, imageEnabled);
      
      console.log('📤 Message sent status:', sent);
      
      if (!sent) {
        throw new Error('Failed to send message - WebSocket not connected');
      }

      // Set a timeout to clear the streaming state if no response comes back
      setTimeout(() => {
        console.log('⏰ Timeout: No response received, clearing streaming state');
        setIsStreamingResponse(false);
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      
      // Add error message to chat
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
      
      // Reset loading state
      setIsStreamingResponse(false);
    }
  }, [messages, searchEnabled, imageEnabled, updateServerChatHistory, sendMessage]);

  const handleAudioRecorded = (audioBlob) => {
    // Add user audio message
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

    // Update server chat history
    updateServerChatHistory(updatedMessages);

    // Send audio through websocket
    sendAudio(audioBlob, "Manual");
  };

  const handleAgentMessage = (message, agent) => {
    // Add user message
    const userMessage = {
      type: 'text',
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Update server chat history
    updateServerChatHistory(updatedMessages);

    // Send message through websocket with agent info and previous messages
    sendMessage({
      text: message,
      previousMessages: messages
    }, {
      name: agent.agent_name,
      id: agent.agent_id
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      size="full"
      scrollBehavior="inside"
      className='text-white'
      backdrop="transparent"
      classNames={{
        base: "bg-transparent backdrop-blur-none",
        backdrop: "bg-black/30 backdrop-blur-sm",
        wrapper: "bg-transparent flex items-start justify-center p-2",
        closeButton: "text-white hover:bg-white/10"
      }}
    >
      <ModalContent 
        style={{ 
          height: 'calc(100vh - 85px)', // Full height minus bottom nav space and margin
          maxHeight: 'calc(100vh - 85px)', 
          width: 'calc(100vw - 16px)', // Almost full width with small margin
          maxWidth: 'calc(100vw - 16px)'
        }}
        className="bg-black/30 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl mt-2 mx-2"
      >
        <ModalHeader className="flex flex-col gap-1 bg-black/20 backdrop-blur-sm border-b border-white/10 rounded-t-2xl">
          <div className="flex items-center justify-between w-full">
            <span className="text-white font-semibold">Chat with Olivia AI</span>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/30 text-green-300 rounded-full text-xs backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  Connected (EP{currentEndpointIndex + 1})
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/30 text-red-300 rounded-full text-xs backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    {isServerUnavailable ? 'Server Unavailable' : isConnecting ? `Connecting EP${currentEndpointIndex + 1}` : 'Disconnected'}
                  </div>
                  {isServerUnavailable && (
                    <button
                      onClick={() => {
                        console.log('🔄 Manual retry button clicked');
                        connect();
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="bg-transparent">
          {/* Messages */}
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
          />

          {/* Enhanced streaming loading indicator - disabled in favor of ThinkingIndicator */}
          {/* {useStreamingMode && (wsIsStreamingResponse || isStreamingResponse) && (
            <StreamingLoadingIndicator
              isLoading={wsIsStreamingResponse || isStreamingResponse}
              currentAction={currentAction}
              actionStatus={actionStatus}
              isStreamingResponse={wsIsStreamingResponse || isStreamingResponse}
            />
          )} */}

          {/* Sources drawer */}
          {/* The 'sources' prop is not defined in this component's state,
              so this block will not render as intended.
              Assuming 'sources' is meant to be managed by ChatMessages or a separate state.
              For now, commenting out to avoid errors. */}
          {/* {sources && sources.length > 0 && (
            <SourcesDrawer 
              sources={sources} 
              isOpen={true} 
              onClose={() => setSources([])}
            />
          )} */}
        </ModalBody>
        <ModalFooter className="bg-black/20 backdrop-blur-sm border-t border-white/10 rounded-b-2xl">
          <ChatInput
            ref={chatInputRef}
            onSendMessage={handleSendMessage}
            onAudioRecorded={handleAudioRecorded}
            onAgentMessage={handleAgentMessage}
            onCancel={handleCancelStreaming}
            disabled={wsIsStreamingResponse || isStreamingResponse}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChatModal;
