import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ThinkingIndicator = ({ 
  processingMessage = null, 
  currentAction = null, 
  isStreamingResponse = false,
  isWarmingUp = false 
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showDots, setShowDots] = useState(true);

  // Engaging thinking messages
  const thinkingMessages = [
    "Let me think about this...",
    "Processing your request...",
    "Analyzing the data...",
    "Getting that information for you...",
    "One moment while I work on this...",
    "Let me gather some insights...",
    "Working on your request...",
    "Thinking through this carefully...",
    "Processing... almost there!",
    "Let me find the best answer for you..."
  ];

  // Startup-specific messages for when chat is warming up
  const startupMessages = [
    "Starting up Olivia AI...",
    "Connecting to my servers...",
    "Getting ready to help you...",
    "Loading my knowledge base...",
    "Preparing to assist you...",
    "Almost ready to chat...",
    "Setting up your session...",
    "Warming up my systems..."
  ];

  // Note: Real backend states will override these enhanced UX messages

  // Cycle through messages - faster during startup, slower during normal thinking
  useEffect(() => {
    const messages = isWarmingUp ? startupMessages : thinkingMessages;
    const speed = isWarmingUp ? 1500 : 3000; // Faster cycling during startup
    
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, speed);

    return () => clearInterval(interval);
  }, [isWarmingUp]);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setShowDots(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Get the appropriate message and icon based on current state
  const getDisplayConfig = () => {
    // PRIORITY 1: STARTUP MODE - Show startup messages when warming up (highest priority)
    if (isWarmingUp) {
      return {
        message: startupMessages[messageIndex],
        icon: <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />,
        color: "text-yellow-400",
        isReal: false
      };
    }
    
    // PRIORITY 2: REAL backend processing message if available
    if (processingMessage) {
      // Check if it's a warming up message (system startup)
      if (processingMessage.includes("Starting up")) {
        return {
          message: processingMessage,
          icon: <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />,
          color: "text-yellow-400",
          isReal: true
        };
      }
      
      return {
        message: processingMessage,
        icon: <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />,
        color: "text-purple-400",
        isReal: true
      };
    }

    // REAL: Show when actually performing web search
    if (currentAction === 'web_search') {
      return {
        message: "Searching the web for latest information...",
        icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />,
        color: "text-blue-400",
        isReal: true
      };
    }

    // REAL: Show when actually streaming response
    if (isStreamingResponse) {
      return {
        message: "Generating response...",
        icon: <Zap className="w-4 h-4 text-green-500 animate-pulse" />,
        color: "text-green-400",
        isReal: true
      };
    }

    // ENHANCED UX: Fallback engaging messages while processing
    return {
      message: thinkingMessages[messageIndex],
      icon: <Brain className="w-4 h-4 text-purple-500 animate-pulse" />,
      color: "text-purple-400",
      isReal: false
    };
  };

  const config = getDisplayConfig();

  return (
    <div className="w-fit max-w-[80%] animate-fadeIn">
      <p className="flex justify-start items-center gap-1 text-[12px] text-opacity-80 mb-1">
        <img
          src="/Olivia-ai-LOGO.png"
          alt="Olivia AI"
          className="w-auto h-[14px]"
        />
        Olivia
        {/* Small indicator to show if this is real processing or enhanced UX */}
        {config.isReal && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded ml-1">
            LIVE
          </span>
        )}
      </p>
      
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Thinking GIF icon - very small */}
          <div className="relative">
            <img 
              src="/THINKING ICON.gif" 
              alt="Thinking" 
              className="w-6 h-6"
            />
          </div>
          
          {/* Message text */}
          <div className="flex items-center gap-1">
            <span className={`text-sm font-medium ${config.color}`}>
              {config.message}
            </span>
            
            {/* Animated dots */}
            <div className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-opacity duration-300 ${
                    showDots ? 'opacity-100' : 'opacity-30'
                  } ${config.color.replace('text-', 'bg-')}`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animation: 'bounce 1s infinite'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading bar - more prominent for warming up */}
        <div className="mt-2 w-full bg-gray-700/50 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full animate-pulse ${
              processingMessage && processingMessage.includes("Starting up")
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
            style={{
              width: processingMessage && processingMessage.includes("Starting up") ? '80%' : '60%',
              animation: 'loading-bar 2s ease-in-out infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};

ThinkingIndicator.propTypes = {
  processingMessage: PropTypes.string,
  currentAction: PropTypes.string,
  isStreamingResponse: PropTypes.bool,
  isWarmingUp: PropTypes.bool
};

export default ThinkingIndicator; 