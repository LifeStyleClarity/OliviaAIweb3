import { useState, useEffect, useRef } from 'react';
import './welcomeDrawer.css';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/react";
import Button from "./Button";
import TypeWriter from './TypeWriter';
import FadeUpMessage from './FadeUpMessage';
import TrendingTokens from '../AgentDataViews/TrendingTokens';
import TokenInfo from '../AgentDataViews/TokenInfo';
import SwapAction from '../AgentDataViews/SwapAction';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for token info (DOGS)
const mockTokenInfoData = {
  tokenData: {
    tokenData: {
      id: "dogs-2",
      icon: "https://static.coinstats.app/coins/dogs-2ggD.png",
      name: "Dogs",
      symbol: "DOGS",
      price: 0.00014819,
      priceChange1d: -13.73,
      marketCap: 75991180,
      volume: 35576688,
      availableSupply: 516750000000,
      totalSupply: 550000000000,
      websiteUrl: "https://t.me/dogshouse_bot",
      twitterUrl: "https://twitter.com/realDogsHouse",
      redditUrl: "https://www.reddit.com"
    }
  },
  comPostSummary: "Community sentiment is mixed with some excitement about recent partnerships but concerns about price volatility.",
  devPostSummary: "Development team announced plans for a new staking feature and improved tokenomics in Q2 2025.",
  telegramSummary: "Active Telegram community with regular updates from the team and growing user engagement."
};

// Mock data for swap action based on the API response
const mockSwapActionData = {
  contract_address: "EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS",
  amount: 0.1,
  swap_type: "Buy",
  meta: {
    symbol: "DOGS",
    display_name: "Dogs",
    priority: 0,
    image_url: "https://static.coinstats.app/coins/dogs-2ggD.png",
    decimals: 9,
    kind: "Jetton",
    deprecated: false,
    community: false,
    blacklisted: false,
    default_symbol: true,
    taxable: false,
    tags: [
      "asset:popular",
      "high_liquidity",
      "asset:default_symbol",
      "asset:liquidity:high",
      "default_symbol"
    ],
    dex_usd_price: "0.0001524268354385744",
    dex_price_usd: "0.0001524268354385744"
  },
  walletAddress: "EQD_____________________________" // Mock wallet address
};

// Mock data for trending tokens based on the API response
const mockTrendingTokensData = [
  {
    "id": "notcoin",
    "icon": "https://static.coinstats.app/coins/notcoinbXo.png",
    "name": "Notcoin",
    "symbol": "NOT",
    "price": 0.002477166342578711,
    "priceChange1d": -15.95
  },
  {
    "id": "EQB4zZusHsbU2vVTPqjhlokIOoiZhEdCMT703CWEzhTOo__X_the-open-network",
    "icon": "https://static.coinstats.app/coins/x-empireVpi.png",
    "name": "X Empire",
    "symbol": "X",
    "price": 0.00005238,
    "priceChange1d": -11.47
  },
  {
    "id": "catizen",
    "icon": "https://static.coinstats.app/coins/catizen2vE.png",
    "name": "Catizen",
    "symbol": "CATI",
    "price": 0.144289,
    "priceChange1d": -21.2
  },
  {
    "id": "hamster-kombat",
    "icon": "https://static.coinstats.app/coins/hamster-kombatHCB.png",
    "name": "Hamster Kombat",
    "symbol": "HMSTR",
    "price": 0.00175244,
    "priceChange1d": 5.67
  },
  {
    "id": "major",
    "icon": "https://static.coinstats.app/coins/majorm3j.png",
    "name": "MAJOR",
    "symbol": "MAJOR",
    "price": 0.151478,
    "priceChange1d": -11.32
  },
  {
    "id": "dogs-2",
    "icon": "https://static.coinstats.app/coins/dogs-2ggD.png",
    "name": "Dogs",
    "symbol": "DOGS",
    "price": 0.00014819,
    "priceChange1d": -13.73
  },
  {
    "id": "gmt-token",
    "icon": "https://static.coinstats.app/coins/gmt-tokenKe6.png",
    "name": "GoMining Token",
    "symbol": "GOMINING",
    "price": 0.44592,
    "priceChange1d": -2.52
  },
  {
    "id": "0xda65892ea771d3268610337e9964d916028b7dad_duckchain",
    "icon": "https://static.coinstats.app/coins/duckchain-tokenuWL.png",
    "name": "DuckChain Token",
    "symbol": "DUCK",
    "price": 0.00301797,
    "priceChange1d": -3.45
  },
  {
    "id": "moew",
    "icon": "https://static.coinstats.app/coins/moewf9K.png",
    "name": "MOEW",
    "symbol": "MOEW",
    "price": 0.00053588,
    "priceChange1d": -22.19
  }
];

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
      text: "Hey there! Welcome to your crypto adventure! 👋✨",
      delay: 2500,
      type: "bot"
    },
    {
      text: "I'm Olivia, your AI crypto buddy! Ready to help you navigate the exciting world of TON and make your crypto journey a blast! 🚀",
      delay: 500,
      type: "bot"
    },
    {
      text: "Let me show you some cool things we can do together. Let me find out what's trending for you.",
      delay: 1000,
      type: "bot"
    },
    {
      text: "What are the trending tokens right now?",
      delay: 1500,
      type: "user"
    },
    {
      text: "Check out these hot tokens making waves on TON right now! 🔥 Notcoin is crushing it, along with X Empire, MAJOR, and more. Take a look:",
      delay: 2000,
      type: "bot",
      data: {
        type: "trending_tokens"
      }
    },
    {
      text: "Let me buy some tokens for you automatcly.",
      delay: 1000,
      type: "bot"
    },
    {
      text: "I want to buy some DOGS tokens",
      delay: 2500,
      type: "user"
    },
    {
      text: "Here it go I bought you some $DOGS token - Just click confim buy to finish your transaction!",
      delay: 1000,
      type: "bot",
      data: {
        type: "swap",
        action: "swap",
        swap_type: "Buy",
        token: "DOGS"
      }
    },
    {
      text: "Thanks Olivia, that's helpful!",
      delay: 5500,
      type: "user"
    },
    {
      text: "Anytime! That's what I'm here for! 😊✨",
      delay: 1000,
      type: "bot"
    },
    {
      text: "BTW, our chat is just the beginning! 🌟 Explore the app to discover awesome features like the Portfolio tracker, Explore section with real-time trends, and even a fun Game! Go ahead and tap around!",
      delay: 1500,
      type: "bot"
    },
    {
      text: "Crypto questions? Token troubles? Market mysteries? I'm always here to help - just ask away! 💬✨",
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
                              {msg.data?.type === "trending_tokens" && (
                                <div className="drawer-animation-container w-full mt-2">
                                  <div className="w-full">
                                    <TrendingTokens meta={mockTrendingTokensData} />
                                  </div>
                                </div>
                              )}
                              {msg.data?.type === "token_info" && msg.data?.token === "DOGS" && (
                                <div className="drawer-animation-container w-full mt-2">
                                  <div className="w-full">
                                    <TokenInfo meta={mockTokenInfoData} />
                                  </div>
                                </div>
                              )}
                              {msg.data?.type === "swap" && msg.data?.token === "DOGS" && (
                                <div className="drawer-animation-container w-full mt-2">
                                  <div className="w-full">
                                    <SwapAction
                                      meta={mockSwapActionData.meta}
                                      amount={mockSwapActionData.amount}
                                      swap_type={mockSwapActionData.swap_type}
                                      contract_address={mockSwapActionData.contract_address}
                                      walletAddress={mockSwapActionData.walletAddress}
                                    />
                                  </div>
                                </div>
                              )}
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
