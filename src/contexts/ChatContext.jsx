import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ChatContext.Provider>
  );
}

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
