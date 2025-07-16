import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input } from "@heroui/react";
import { Send, X } from 'lucide-react';
import PropTypes from 'prop-types';
import Button from './Button';
import { agents } from '../../utils/agentData';
import { MicrophoneRecorder } from './microphone';

const ChatInput = forwardRef(({ onSendMessage, onAudioRecorded, onAgentMessage, onCancel, disabled }, ref) => {
  const [message, setMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filteredAgents, setFilteredAgents] = useState(agents);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setMessage: (text) => {
      setMessage(text);
    },
    getMessage: () => message,
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleInputChange = (value) => {
    setMessage(value);
    const position = inputRef.current?.selectionStart;

    if (value[position - 1] === "@") {
      setShowAgentDropdown(true);
      setFilteredAgents(agents);
    } else if (value.includes("@")) {
      const match = value.match(/@(\w*)$/);
      if (match) {
        const searchText = match[1].toLowerCase();
        const filtered = agents.filter(agent =>
          agent.agent_name.toLowerCase().includes(searchText)
        );
        setFilteredAgents(filtered);
        setShowAgentDropdown(true);
      }
    } else {
      setShowAgentDropdown(false);
    }
  };

  const handleAgentSelect = (agentId) => {
    const agent = agents.find(a => a.agent_id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      const cleanedMessage = message.replace(/@\w*$/, "").trim();
      setMessage(cleanedMessage);
      setShowAgentDropdown(false);
    }
  };

  const removeAgent = () => {
    setSelectedAgent(null);
  };

  const handleSubmit = (e) => {
    // Check if e exists and has preventDefault method before calling it
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (message.trim() && !disabled) {
      if (selectedAgent) {
        onAgentMessage(message, selectedAgent);
      } else {
        onSendMessage(message);
      }
      setMessage('');
      // Removed setSelectedAgent(null) to keep the agent selected after sending a message
    }
  };

  return (
    <div className={`w-full border-t duration-300 border-[#fff]/20 border-solid ${isRecording ? 'py-3 px-2' : 'py-4 px-4'}`}>
      <form onSubmit={handleSubmit} className="flex duration-300 flex-col gap-3">
        <div className="flex items-center duration-300 gap-2 relative">
          <div className={`flex-1 duration-300 relative ${isRecording ? 'hidden' : ''}`}>
            <div className="flex flex-col items-start duration-300 gap-3 w-full">
              {selectedAgent && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#31F46E]/20 to-[#0AFDE1]/20 backdrop-blur-sm rounded-full px-4 py-2 border border-[#31F46E]/30 transition-all hover:from-[#31F46E]/30 hover:to-[#0AFDE1]/30">
                  <div className="w-2 h-2 bg-[#31F46E] rounded-full animate-pulse"></div>
                  <span className="text-[#31F46E] text-sm font-medium">@{selectedAgent.agent_name}</span>
                  <button
                    type="button"
                    onClick={removeAgent}
                    className="text-[#31F46E]/70 hover:text-[#31F46E] ml-1 rounded-full w-5 h-5 flex items-center justify-center transition-all hover:bg-[#31F46E]/20"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="w-full relative group">
                <Input
                  ref={inputRef}
                  type="text"
                  variant="bordered"
                  radius="lg"
                  size="lg"
                  placeholder="Ask Olivia anything... Type @ to mention agents"
                  value={message}
                  onValueChange={handleInputChange}
                  classNames={{
                    input: "bg-transparent py-3 text-white placeholder:text-gray-400 text-base",
                    innerWrapper: "bg-transparent",
                    inputWrapper: [
                      "bg-gradient-to-r from-[#1a1f2e] to-[#1e2532]",
                      "hover:from-[#1f2437] hover:to-[#232a39]",
                      "group-data-[focused=true]:from-[#242b3a] group-data-[focused=true]:to-[#28303f]",
                      "!cursor-text",
                      "border-[#fff]/10",
                      "group-data-[focused=true]:border-[#31F46E]/50",
                      "hover:border-[#fff]/20",
                      "shadow-lg",
                      "backdrop-blur-sm",
                      "transition-all duration-300",
                      "min-h-[56px]",
                      "group-data-[focused=true]:shadow-lg",
                      "group-data-[focused=true]:shadow-[#31F46E]/20"
                    ]
                  }}
                />
                {/* Focus ring effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#31F46E]/10 to-[#0AFDE1]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"></div>
              </div>
            </div>

            {showAgentDropdown && (
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-gradient-to-b from-[#1a1f2e] to-[#1e2532] py-3 px-2 rounded-xl shadow-2xl border border-[#fff]/10 backdrop-blur-lg overflow-hidden z-[9999] animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#31F46E]/20 to-[#0AFDE1]/20 opacity-50 blur-sm"></div>
                <div className="relative">
                  {(() => {
                    const agentsByType = filteredAgents.reduce((acc, agent) => {
                      if (!acc[agent.type]) {
                        acc[agent.type] = {
                          type_name: agent.type_name,
                          agents: [],
                        };
                      }
                      acc[agent.type].agents.push(agent);
                      return acc;
                    }, {});

                    return Object.entries(agentsByType).map(([type, { type_name, agents: typeAgents }]) =>
                      typeAgents.length > 0 && (
                        <div key={type} className="mb-3 last:mb-0">
                          <div className="px-3 py-2 text-xs font-semibold text-[#31F46E]/80 uppercase tracking-wide border-b border-[#fff]/5 mb-2">
                            {type_name}
                          </div>
                          {typeAgents.map((agent) => {
                            const Icon = agent.icon;
                            return (
                              <button
                                key={agent.agent_id}
                                type="button"
                                onClick={() => handleAgentSelect(agent.agent_id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-[#31F46E]/10 hover:to-[#0AFDE1]/10 text-gray-300 hover:text-white transition-all duration-200 group"
                                disabled={disabled}
                              >
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#31F46E]/20 group-hover:bg-[#31F46E]/30 transition-colors">
                                  {typeof agent.icon === "string" ? (
                                    <img
                                      src={agent.icon}
                                      alt={agent.agent_name}
                                      className="w-3 h-3"
                                    />
                                  ) : (
                                    <Icon className="w-3 h-3 text-[#31F46E] group-hover:text-[#0AFDE1]" />
                                  )}
                                </div>
                                <span className="text-sm font-medium group-hover:text-white transition-colors">
                                  {agent.agent_name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end items-center gap-3">
          <div className={`flex items-center gap-3  ${isRecording ? "w-full": ""}`}>
            {/* <MicrophoneRecorder
              onAudioRecorded={onAudioRecorded}
              onRecordingStateChange={setIsRecording}
              disabled={disabled}
            /> */}
            {!isRecording && (
              <>
                {disabled && onCancel ? (
                  <Button
                    type="button"
                    variant="light"
                    isIconOnly
                    className="min-w-unit-12 w-12 h-12 p-0 rounded-full transition-all hover:scale-105 active:scale-95 hover:bg-red-500/20"
                    onPress={onCancel}
                  >
                    <X className="w-5 h-5 text-red-400 hover:text-red-300" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="light"
                    isIconOnly
                    className={`min-w-unit-12 w-12 h-12 p-0 rounded-full transition-all ${
                      !message.trim() || disabled 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:scale-105 active:scale-95 hover:bg-gradient-to-r hover:from-[#31F46E]/20 hover:to-[#0AFDE1]/20'
                    }`}
                    disabled={!message.trim() || disabled}
                    onPress={handleSubmit}
                  >
                    <Send className={`w-5 h-5 transition-colors ${!message.trim() || disabled ? 'text-gray-400' : 'text-[#31F46E] hover:text-[#0AFDE1]'}`} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onAudioRecorded: PropTypes.func,
  onAgentMessage: PropTypes.func,
  onCancel: PropTypes.func,
  disabled: PropTypes.bool,
};

ChatInput.defaultProps = {
  onAudioRecorded: () => {},
  onAgentMessage: () => {},
  onCancel: null,
  disabled: false,
};

ChatInput.displayName = 'ChatInput';

export default ChatInput;
