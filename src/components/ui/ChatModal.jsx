import { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useChatContext } from '../../contexts/ChatContext';
import { initializeChat, getExtraData, setWebsocketRunning } from '../../utils/olivia';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import useAudioWebSocket from '../../hooks/useAudioWebSocket';
import useChatWebSocket from '../../hooks/useChatWebSocket';
import { chatService } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const ChatModal = () => {
  const { isOpen, setIsOpen } = useChatContext();
  const [modalHeight, setModalHeight] = useState(0);
  const [messages, setMessages] = useState([]);
  const [processingMessage, setProcessingMessage] = useState(null);
  const chatInputRef = useRef(null);
  const isProcessingRef = useRef(false);
  const { userData } = useAuth();

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (userData?.user_id) {
        try {
          const data = await chatService.getChatHistory(userData.user_id);
          //console.log("USER CHAT DATA: ", data);

          if (data && data.chat_history && Array.isArray(data.chat_history)) {
            // Use the full message structure directly
            setMessages(data.chat_history);
          }
        } catch (error) {
          console.error("Failed to load chat history:", error);
        }
      }
    };

    loadChatHistory();
  }, [userData?.user_id]);

  useEffect(() => {
    // Initialize the chat with setIsOpen function
    initializeChat(setIsOpen);

    // Calculate modal height (window height - 30%)
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      setModalHeight(windowHeight * 0.9);
    };

    // Initial calculation
    calculateHeight();

    // Recalculate on window resize
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [setIsOpen]);

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

  const { sendMessage, disconnect: disconnectChat, isBotResponding } = useChatWebSocket(handleWebSocketMessage);
  const { sendAudio, disconnect: disconnectAudio } = useAudioWebSocket(handleWebSocketMessage);

  useEffect(() => {
    return () => {
      disconnectChat();
      disconnectAudio();
      setWebsocketRunning(false);
      isProcessingRef.current = false;
    };
  }, [disconnectChat, disconnectAudio]);

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

  // Function to update chat history on the server
  const updateServerChatHistory = async (updatedMessages) => {
    if (userData?.user_id) {
      try {
        // Create update data object with the full message structure
        const updateData = {
          chat_history: updatedMessages
        };

        // Update chat history on the server
        await chatService.updateChatHistory(userData.user_id, updateData);
      } catch (error) {
        console.error("Failed to update chat history on server:", error);
      }
    }
  };

  const handleSendMessage = (message) => {
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

    // Send message through websocket with previous messages
    sendMessage({
      text: message,
      previousMessages: messages
    });
  };

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
      size="2xl"
      scrollBehavior="inside"
      className='bg-gradient-to-t from-[#0b090b] to-[#1b1b1b] text-white'
    >
      <ModalContent style={{ height: modalHeight, maxHeight: modalHeight }}>
        <ModalHeader>Chat with Olivia AI</ModalHeader>
        <ModalBody >
          {/* Show extra data if available */}
          {/* {getExtraData() && (
            <div className="mb-4 p-4 bg-black rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Selected Data</h3>
              <div className="text-gray-700">
                {Object.entries(getExtraData()).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="font-medium">{key}: </span>
                    <span>{typeof value === 'object' ? '...' : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          {/* Messages */}
          <ChatMessages
            messages={messages}
            isBotResponding={isBotResponding}
            processingMessage={processingMessage}
            onUpdateMessage={(index, updates) => {
              setMessages(prev => {
                const updatedMessages = prev.map((msg, i) =>
                  i === index ? { ...msg, ...updates } : msg
                );
                // Update server chat history with the updated messages
                updateServerChatHistory(updatedMessages);
                return updatedMessages;
              });
            }}
            onSendMessage={handleSendMessage}
          />

          {/* Typing indicator moved to ChatMessages component */}
        </ModalBody>
        <ModalFooter className="flex flex-col gap-4 w-full p-0">
          <ChatInput
            ref={chatInputRef}
            onSendMessage={handleSendMessage}
            onAudioRecorded={handleAudioRecorded}
            onAgentMessage={handleAgentMessage}
            disabled={isBotResponding}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChatModal;
