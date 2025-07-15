import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AudioPlayback } from './microphone';
import ChatActionRenderer from './ChatActionRenderer';
import ReactMarkdown from 'react-markdown';
import TypeWriter from './TypeWriter';
import TypingDots from './TypingDots';
import FadeUpMessage from './FadeUpMessage';

const ChatMessages = ({ messages, onUpdateMessage, onSendMessage, isBotResponding, processingMessage }) => {
  const messagesEndRef = useRef(null);
  //console.log("messages: ", messages)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const prefillOptions = [
    "What's trending today Olivia?",
    "What @elonmusk is talking on X?",
    "I want to buy $DOGS with 0.1 TON",
    "Tell me more about $DOGS"
  ];

  return (
    <div className="flex  flex-col gap-4 h-full">
      {messages.map((msg, index) => (
        <div key={index}>
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
                  <div className="prose prose-invert max-w-none prose-p:text-[12px] prose-p:leading-5 prose-p:my-0 text-[12px]">
                    {msg.isNew ? (
                      <div className="text-[12px] leading-5">
                        <TypeWriter
                          text={msg.text}
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
                          img: ({ ...props }) => (
                            <img
                              {...props}
                              style={{
                                width: "24px",
                                height: "24px",
                                objectFit: "contain",
                                display: "inline-block",
                                verticalAlign: "middle",
                                margin: 0,
                                borderRadius: "9999px",
                              }}
                            />
                          ),
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
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </FadeUpMessage>
            )}
          </div>
          {msg.typingComplete && msg.action_type && (
            <div className="w-full mt-2">
              <ChatActionRenderer
                action_type={msg.action_type}
                sub_action_type={msg.sub_action_type}
                meta={msg.meta}
                amount={msg.amount}
                swap_type={msg.swap_type}
                contract_address={msg.contract_address}
              />
            </div>
          )}
        </div>
      ))}
      {/* Processing message with typing indicator */}
      {messages.length > 0 && isBotResponding && (
        <div className="w-fit max-w-[80%]">
          <p className="flex justify-start items-center gap-1 text-[12px] text-opacity-80">
            <img
              src="/Olivia-ai-LOGO.png"
              alt="Olivia AI"
              className="w-auto h-[14px]"
            />
            Olivia
          </p>
          <div className="flex items-center gap-1 bg-transparent text-gray-300 mb-2 rounded-lg">
            <div className="text-[12px] leading-5 font-medium">
              {processingMessage ? (
                <TypeWriter 
                  text={processingMessage} 
                  speed={5} 
                  onTextUpdate={() => scrollToBottom()}
                />
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />

      {messages.length === 0 && (
        <div className="mt-auto mb-4">
          <div className="flex flex-col gap-3">
            <FadeUpMessage>
              <p className="text-gray-400 text-sm text-center">Start a conversation with Olivia</p>
            </FadeUpMessage>
            <div className="flex flex-wrap justify-center gap-2">
              {prefillOptions.map((option, index) => (
                <div
                  key={index}
                  className="animate-prefill-fade-up"
                  style={{
                    animationDelay: `${(index + 1) * 150}ms`
                  }}
                >
                  <button
                    onClick={() => {
                      // Only trigger the AI response, which will add the user message to the chat
                      if (onSendMessage) {
                        onSendMessage(option);
                      }
                    }}
                    className="px-4 py-2 rounded-full text-sm bg-gradient-to-r from-[#31F46E]/10 to-[#0AFDE1]/10 text-[#31F46E] hover:from-[#31F46E]/20 hover:to-[#0AFDE1]/20 transition-all border border-[#31F46E]/20"
                  >
                    {option}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className='min-h-[24px] w-full'></div>
    </div>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      sender: PropTypes.oneOf(['user', 'bot', 'assistant']).isRequired,
      type: PropTypes.oneOf(['text', 'audio']),
      text: PropTypes.string,
      audioBlob: PropTypes.instanceOf(Blob),
      showText: PropTypes.bool,
      isNew: PropTypes.bool,
      typingComplete: PropTypes.bool,
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
};

export default ChatMessages;
