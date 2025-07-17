import { useState, useEffect, useRef } from 'react';
import './welcomeDrawer.css';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/react";
import Button from "./Button";
import TypeWriter from './TypeWriter';
import FadeUpMessage from './FadeUpMessage';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/services/auth.service';
import { useAuth } from '../../contexts/AuthContext';





const WelcomeDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const { telegramUser, setTelegramUser, userData, setUserData } = useAuth();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const welcomeMessages = [
    {
      text: "Hey there! Welcome to your AI-powered experience! 👋✨",
      delay: 2500,
      type: "bot"
    },
    {
      text: "I'm Olivia, your AI assistant! Ready to help you with questions, insights, and personalized assistance whenever you need it! 🚀",
      delay: 500,
      type: "bot"
    },
    {
      text: "Let me show you how we can chat together. I can help with all sorts of questions!",
      delay: 1000,
      type: "bot"
    },
    {
      text: "What can you help me with?",
      delay: 1500,
      type: "user"
    },
    {
      text: "I can help you with a wide variety of topics! Ask me about current events, get explanations, research information, or just have a friendly conversation. I'm here to assist! 🔥",
      delay: 2000,
      type: "bot"
    },
    {
      text: "That sounds amazing! Let's chat.",
      delay: 1500,
      type: "user"
    },
    {
      text: "Perfect! I'm excited to help you. Feel free to ask me anything - I'm here whenever you need assistance! 😊✨",
      delay: 1000,
      type: "bot"
    },
    {
      text: "BTW, our chat is just the beginning! 🌟 Chat with Olivia AI to get the latest insights, market analysis, and personalized AI assistance. Go ahead and start chatting!",
      delay: 1500,
      type: "bot"
    },
    {
      text: "Questions about anything? Need help with research? Want to chat? I'm always here to help - just ask away! 💬✨",
      delay: 1000,
      type: "bot"
    },

  ];

  useEffect(() => {
    if (isOpen) {
      // Show first message immediately when drawer opens
      setMessages([{ ...welcomeMessages[0], isNew: true }]);
    } else {
      // Reset messages when drawer closes
      setMessages([]);
    }
  }, [isOpen]);

  // Effect to handle user messages which don't have typing animation
  useEffect(() => {
    if (messages.length > 0) {
      // Scroll to bottom when messages change
      scrollToBottom();
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === "user" && lastMessage.isNew) {
        // Mark user message as not new anymore
        const updatedMessages = [...messages];
        updatedMessages[messages.length - 1] = {
          ...lastMessage,
          isNew: false
        };

        setMessages(updatedMessages);

        // Trigger next message after user message
        const currentIndex = welcomeMessages.findIndex(msg => msg.text === lastMessage.text);
        if (currentIndex >= 0 && currentIndex < welcomeMessages.length - 1) {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              { ...welcomeMessages[currentIndex + 1], isNew: true }
            ]);
          }, welcomeMessages[currentIndex + 1].delay);
        }
      }
    }
  }, [messages]);

  // Additional effect specifically for scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleMessageComplete = (index) => {
    // Update current message as complete
    const updatedMessages = [...messages];
    updatedMessages[index] = {
      ...updatedMessages[index],
      typingComplete: true,
      isNew: false
    };

    // Show next message if available
    if (index < welcomeMessages.length - 1) {
      setTimeout(() => {
        setMessages([
          ...updatedMessages,
          { ...welcomeMessages[index + 1], isNew: true }
        ]);
      }, welcomeMessages[index + 1].delay);
    } else {
      // This is the last message
      setAnimationComplete(true);
    }

    setMessages(updatedMessages);
  };

  const handleContinue = async () => {


    // Or, if you're using state or context, you can update it here:
    // updateUser({ hasSeenWelcome: true });
    await updateUser(userData.user_id, {
      first_user: false
    });
    // Then close the drawer.
    onClose();
  };


  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      placement="right"
      hideCloseButton
    >
      <DrawerContent>
        <DrawerHeader className="border-b bg-[#0A0A0A] border-gray-800">
          <div className="flex items-center gap-2">
            <img
              src="/Olivia-ai-LOGO.png"
              alt="Olivia AI"
              className="w-auto h-[20px]"
            />
            <div className='flex flex-col justify-start items-start'>
              <span className="text-white text-xl">Welcome to Olivia AI</span>
              <p className='text-white/80 font-extralight text-[14px] -mt-1'>Here's some of the things I can do</p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody className="bg-[#0A0A0A]">
          <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {messages.map((msg, index) => {
              // Check if this is the first bot message or if it follows a user message
              const isPreviousMessageFromUser = index > 0 && messages[index - 1].type === "user";
              const isFirstMessage = index === 0;
              const shouldShowOliviaLabel = msg.type === "bot" && (isFirstMessage || isPreviousMessageFromUser);

              return (
                <div key={index}>
                  {shouldShowOliviaLabel && (
                    <p className="flex justify-start text-white items-center gap-1 text-[12px] text-opacity-80">
                      <img
                        src="/Olivia-ai-LOGO.png"
                        alt="Olivia AI"
                        className="w-auto h-[14px]"
                      />
                      Olivia
                    </p>
                  )}
                  <div
                    className={`mb-2 p-2 rounded-lg ${msg.type === "user"
                      ? "bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 ml-auto"
                      : msg.data ? "bg-transparent text-gray-100" : "bg-[#131820] text-gray-100"
                      } ${msg.type === "user"
                        ? "w-fit max-w-[80%] ml-auto"
                        : "w-fit max-w-[80%]"
                      }`}
                  >
                    <FadeUpMessage>
                      <div className="flex flex-col gap-2">
                        <div className={`prose max-w-none prose-p:text-[12px] prose-p:leading-5 prose-p:my-0 text-[12px] ${msg.type === "bot" ? "prose-invert" : ""}`}>
                          {msg.type === "bot" && !msg.typingComplete ? (
                            <div className="text-[12px] leading-5">
                              <TypeWriter
                                text={msg.text}
                                speed={5}
                                onComplete={() => handleMessageComplete(index)}
                              />
                            </div>
                          ) : (
                            <div className={`text-[12px] leading-5 ${msg.type === "user" ? "text-gray-900" : "text-white"}`}>
                              {msg.text}


                            </div>
                          )}
                        </div>
                      </div>
                    </FadeUpMessage>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </DrawerBody>
        {animationComplete && (
          <DrawerFooter className="bg-[#0A0A0A] border-t border-gray-800">
            <Button
              onPress={handleContinue}
              className="w-full bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 font-medium"
            >
              Continue
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

WelcomeDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default WelcomeDrawer;
