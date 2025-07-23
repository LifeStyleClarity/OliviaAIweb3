import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AudioPlayback } from './microphone';
import ChatActionRenderer from './ChatActionRenderer';
import ReactMarkdown from 'react-markdown';
import TypeWriter from './TypeWriter';
import TypingDots from './TypingDots';
import FadeUpMessage from './FadeUpMessage';
import SourcesDrawer from './SourcesDrawer';
import ThinkingIndicator from './ThinkingIndicator';

const ChatMessages = ({ 
  messages, 
  onUpdateMessage, 
  onSendMessage, 
  isBotResponding, 
  processingMessage, 
  useStreamingMode = false,
  isStreamingResponse = false,
  currentAction = null,
  actionStatus = null,
  isWarmingUp = false 
}) => {
  const messagesEndRef = useRef(null);
  //console.log("messages: ", messages)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  console.log('🟦 ChatMessages rendering:', { messageCount: messages.length, messages: messages.map(m => ({ sender: m.sender, type: m.type, isExplanation: m.isExplanation, text: m.text?.substring(0, 50) })) });
  
  return (
    <div className="flex  flex-col gap-4 h-full">
      {messages.map((msg, index) => {
        // Calculate fade: newest messages (highest index) = 100% opacity
        // Older messages (lower index) = fade out towards top
        const totalMessages = messages.length;
        const messageAge = totalMessages - index - 1; // 0 = newest, higher = older
        const fadeOpacity = Math.max(0.2, 1 - (messageAge * 0.15));
        
        return (
        <div key={index} style={{ opacity: fadeOpacity }}>
          {msg.sender === "user" ? null : (
            <p className="flex justify-start items-center gap-1 text-[12px] text-opacity-80">
              <img
                src="/Olivia-ai-LOGO.png"
                alt="Olivia AI"
                className="w-auto h-[14px]"
              />
              Olivia
            </p>
          )}
          <div
            className={`mb-2 p-2 rounded-lg ${msg.sender === "user" && msg.type !== "audio"
                ? "bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 ml-auto"
                : "bg-transparent text-gray-100"
              } ${msg.sender === "user"
                ? "w-fit max-w-[80%] ml-auto"
                : "w-fit max-w-[80%]"
              }`}
          >
            {msg.type === "audio" ? (
              <div className="flex flex-col gap-2">
                <FadeUpMessage>
                  <div className="flex flex-col gap-2">
                    <AudioPlayback
                      audioBlob={msg.audioBlob}
                      autoPlay={msg.sender === "bot" || msg.sender === "assistant"}
                    />
                    {(msg.sender === "bot" || msg.sender === "assistant") && msg.text && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            onUpdateMessage(index, { showText: !msg.showText });
                          }}
                          className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`duration-250 ${msg.showText ? "opacity-100" : "opacity-50"
                              }`}
                            style={{
                              transform: msg.showText
                                ? "rotate(180deg)"
                                : "none",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                          <span
                            className={`text-[12px] duration-250 ${msg.showText ? "opacity-100" : "opacity-50"
                              }`}
                          >
                            {msg.showText ? "Hide transcript" : "Show transcript"}
                          </span>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${msg.showText
                              ? "max-h-[500px] opacity-100"
                              : "max-h-0 opacity-0"
                            }`}
                        >
                          <div className="mt-2 text-[12px] text-gray-300 bg-gray-800/50 p-2 rounded">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </FadeUpMessage>
              </div>
            ) : (
              <FadeUpMessage>
                <div className="flex flex-col gap-2">
                  {/* Explanation message indicator */}
                  {msg.isExplanation && (
                    <div className="text-xs text-gray-500 italic">
                      Explanation
                    </div>
                  )}
                  
                  <div className={`prose prose-invert max-w-none prose-p:text-[12px] prose-p:leading-5 prose-p:my-0 text-[12px] ${
                    msg.isExplanation ? 'border-l-2 border-purple-500 pl-3' : ''
                  }`}>
                    {msg.isNew ? (
                      <div className="text-[12px] leading-5">
                        <TypeWriter
                          text={msg.text || msg.content}
                          speed={5}
                          onTextUpdate={() => scrollToBottom()}
                          onComplete={() => {
                            onUpdateMessage(index, {
                              typingComplete: true,
                              isNew: false,
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <ReactMarkdown
                        components={{
                          img: ({ src, alt, ...props }) => {
                            return (
                            <img
                              {...props}
                                src={src}
                                alt={alt}
                              style={{
                                  maxWidth: "200px",
                                  maxHeight: "200px",
                                  width: "auto",
                                  height: "auto",
                                objectFit: "contain",
                                  display: "block",
                                  margin: "8px 0",
                                  borderRadius: "8px",
                                  border: "1px solid #374151"
                                }}
                                onError={(e) => {
                                  // Replace with placeholder on error
                                  e.target.style.display = "none";
                                  const placeholder = document.createElement("div");
                                  placeholder.innerHTML = `
                                    <div style="
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      width: 200px;
                                      height: 100px;
                                      background-color: #374151;
                                      border-radius: 8px;
                                      border: 1px solid #4B5563;
                                      margin: 8px 0;
                                      flex-direction: column;
                                      gap: 8px;
                                    ">
                                      <div style="font-size: 24px;">📷</div>
                                      <div style="font-size: 12px; color: #9CA3AF; text-align: center;">
                                        Image failed to load
                                      </div>
                                    </div>
                                  `;
                                  placeholder.title = alt || "Image failed to load";
                                  e.target.parentNode.insertBefore(placeholder, e.target);
                              }}
                            />
                            );
                          },
                          a: ({ ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#31F46E",
                                textDecoration: "underline",
                              }}
                            />
                          ),
                          p: ({ ...props }) => (
                            <p {...props} className="text-[12px] leading-5 my-0" />
                          ),
                        }}
                      >
                        {msg.text || msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Show sources if available */}
                  {msg.sources && (
                    <SourcesDrawer sources={msg.sources} />
                  )}
                </div>
              </FadeUpMessage>
            )}
          </div>
          {/* Render actions for completed messages */}
          {(msg.typingComplete || msg.isComplete) && msg.action_type && (
            <div className="w-full mt-2">
              <ChatActionRenderer
                action_type={msg.action_type}
                sub_action_type={msg.sub_action_type}
                meta={msg.meta}
                amount={msg.amount}
                swap_type={msg.swap_type}
                contract_address={msg.contract_address}
                onSendMessage={onSendMessage}
              />
            </div>
          )}
        </div>
        );
      })}
      {/* Enhanced thinking indicator - shows real processing state */}
      {/* Show thinking indicator immediately when chat opens, even with no messages */}
      {(isBotResponding || isStreamingResponse || isWarmingUp) && (
        <ThinkingIndicator
          processingMessage={processingMessage}
          currentAction={currentAction}
          isStreamingResponse={isStreamingResponse}
          isWarmingUp={isWarmingUp}
        />
      )}

      <div ref={messagesEndRef} />


      <div className='min-h-[24px] w-full'></div>
    </div>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      sender: PropTypes.oneOf(['user', 'bot', 'assistant', 'agent']).isRequired,
      type: PropTypes.oneOf(['text', 'audio']),
      text: PropTypes.string,
      content: PropTypes.string, // New: for streaming messages
      audioBlob: PropTypes.instanceOf(Blob),
      showText: PropTypes.bool,
      isNew: PropTypes.bool,
      typingComplete: PropTypes.bool,
      isComplete: PropTypes.bool, // New: for streaming completion
      isExplanation: PropTypes.bool, // New: for explanation messages
      completed: PropTypes.bool, // New: for explanation completion
      sources: PropTypes.array, // New: for source citations
      role: PropTypes.oneOf(['user', 'assistant']), // New: for streaming format
      action_type: PropTypes.string,
      sub_action_type: PropTypes.string,
      meta: PropTypes.any,
      amount: PropTypes.number,
      swap_type: PropTypes.string,
      contract_address: PropTypes.string,
    })
  ),
  onUpdateMessage: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func,
  isBotResponding: PropTypes.bool,
  processingMessage: PropTypes.string,
  useStreamingMode: PropTypes.bool,
  isStreamingResponse: PropTypes.bool,
  currentAction: PropTypes.string,
  actionStatus: PropTypes.string,
  isWarmingUp: PropTypes.bool
};

export default ChatMessages;
