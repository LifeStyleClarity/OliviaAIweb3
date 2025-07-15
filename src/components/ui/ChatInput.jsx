import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@heroui/react";
import { Send } from 'lucide-react';
import PropTypes from 'prop-types';
import Button from './Button';
import { agents } from '../../utils/agentData';
import { MicrophoneRecorder } from './microphone';

const ChatInput = forwardRef(({ onSendMessage, onAudioRecorded, onAgentMessage, disabled }, ref) => {
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
    <div className={`w-full border-t duration-250 border-[#fff]/10 border-solid ${isRecording ? 'py-3 px-2' : 'py-4 px-4'}`}>
      <form onSubmit={handleSubmit} className="flex duration-250 flex-col gap-3">
        <div className="flex items-center duration-250 gap-2 relative">
          <div className={`flex-1 duration-250 relative ${isRecording ? 'hidden' : ''}`}>
            <div className="flex flex-col items-start duration-250 gap-2 w-full">
              {selectedAgent && (
                <div className="flex items-center gap-1  bg-[#31F46E]/15 rounded-full px-3 py-1.5 transition-all">
                  <span className="text-[#31F46E] text-xs font-medium">@{selectedAgent.agent_name}</span>
                  <button
                    type="button"
                    onClick={removeAgent}
                    className="text-[#31F46E]/70 hover:text-[#31F46E] ml-1 rounded-full w-4 h-4 flex items-center justify-center"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </div>
              )}
              <Input
                ref={inputRef}
                type="text"
                variant="bordered"
                radius="full"
                size="lg"
                placeholder="Type @ to mention an agent..."
                value={message}
                onValueChange={handleInputChange}
                classNames={{
                  input: "bg-transparent py-2",
                  innerWrapper: "bg-transparent",
                  inputWrapper: [
                    "bg-[#1D2530]",
                    "hover:bg-[#1D2530]",
                    "group-data-[focused=true]:bg-[#1D2530]",
                    "!cursor-text",
                    "border-none",
                    "shadow-sm",
                    "transition-all",
                    "min-h-[48px]"
                  ]
                }}
              />
            </div>

            {showAgentDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-900/95 py-2 px-1 rounded-xl shadow-xl border border-gray-700/50 backdrop-blur-sm overflow-hidden z-[9999]">
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
                      <div key={type}>
                        <div className="px-2 py-1.5 text-[12px] font-semibold text-[#71717A]">
                          {type_name}
                        </div>
                        {typeAgents.map((agent) => {
                          const Icon = agent.icon;
                          return (
                            <button
                              key={agent.agent_id}
                              type="button"
                              onClick={() => handleAgentSelect(agent.agent_id)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 text-gray-300 hover:text-gray-100"
                              disabled={disabled}
                            >
                              {typeof agent.icon === "string" ? (
                                <img
                                  src={agent.icon}
                                  alt={agent.agent_name}
                                  className="w-[16px] h-[16px]"
                                />
                              ) : (
                                <Icon className="w-[16px] h-[16px] text-[#9ca3af] opacity-60" />
                              )}
                              <span className="text-[#D1D5DB] text-[14px]">
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
            )}
          </div>
        </div>

        <div className="flex justify-between items-center gap-3">
          {!isRecording &&
            <Dropdown className={`bg-gray-900/95 backdrop-blur-sm ${isRecording ? 'hidden' : ''}`} backdrop="opaque">
              <DropdownTrigger>
                <Button
                  variant="bordered"
                  className="text-gray-300 border-gray-600/50 h-11 rounded-full hover:bg-gray-800/30 transition-all"
                  disabled={disabled}
                >
                  <div className="text-sm flex justify-start items-center gap-2">
                    <img
                      src="/Olivia-ai-LOGO.png"
                      alt="Olivia AI"
                      className="w-auto h-5"
                    />
                    <span className="font-medium">Agents</span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Agent Actions"
                variant="shadow"
                className="bg-gray-900/95 backdrop-blur-sm"
                itemClasses={{
                  base: "text-gray-300 data-[hover=true]:bg-gray-800/80 data-[hover=true]:text-gray-100 data-[hover=true]:shadow-none transition-colors",
                }}
              >
                {(() => {
                  const agentsByType = agents.reduce((acc, agent) => {
                    if (!acc[agent.type]) {
                      acc[agent.type] = {
                        type_name: agent.type_name,
                        agents: [],
                      };
                    }
                    acc[agent.type].agents.push(agent);
                    return acc;
                  }, {});

                  return Object.entries(agentsByType).map(([type, { type_name, agents: typeAgents }]) => (
                    <DropdownSection key={type} title={type_name}>
                      {typeAgents.map((agent) => {
                        const Icon = agent.icon;
                        return (
                          <DropdownItem
                            key={agent.agent_id}
                            onPress={() => handleAgentSelect(agent.agent_id)}
                            startContent={
                              typeof agent.icon === "string" ? (
                                <img
                                  src={agent.icon}
                                  alt={agent.agent_name}
                                  className="w-4 h-4 opacity-60"
                                />
                              ) : (
                                <Icon className="w-4 h-4 text-gray-400" />
                              )
                            }
                            isDisabled={disabled}
                          >
                            {agent.agent_name}
                          </DropdownItem>
                        );
                      })}
                    </DropdownSection>
                  ));
                })()}
              </DropdownMenu>
            </Dropdown>
          }
          <div className={`flex items-center gap-3  ${isRecording ? "w-full": ""}`}>
            {/* <MicrophoneRecorder
              onAudioRecorded={onAudioRecorded}
              onRecordingStateChange={setIsRecording}
              disabled={disabled}
            /> */}
            {!isRecording && (
              <Button
                type="submit"
                variant="light"
                isIconOnly
                className={`min-w-unit-12 w-12 h-12 p-0 rounded-full transition-all ${
                  !message.trim() || disabled 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:scale-105 active:scale-95'
                }`}
                disabled={!message.trim() || disabled}
                onPress={handleSubmit}
              >
                <Send className={`w-5 h-5 ${!message.trim() || disabled ? 'text-gray-400' : 'text-[#31F46E] hover:text-[#31F46E]/80'}`} />
              </Button>
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
  disabled: PropTypes.bool,
};

ChatInput.defaultProps = {
  onAudioRecorded: () => {},
  onAgentMessage: () => {},
  disabled: false,
};

ChatInput.displayName = 'ChatInput';

export default ChatInput;
