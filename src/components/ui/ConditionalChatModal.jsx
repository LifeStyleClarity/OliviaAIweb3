import { useChatContext } from '../../contexts/ChatContext';
import { initializeChat } from '../../utils/olivia';
import ChatModal from './ChatModal';
import { useEffect } from 'react';

const ConditionalChatModal = () => {
  const { isOpen, setIsOpen } = useChatContext();
  
  // Initialize chat functionality when component mounts
  useEffect(() => {
    initializeChat(setIsOpen);
  }, [setIsOpen]);
  
  // Only render ChatModal when it's actually opened
  return isOpen ? <ChatModal /> : null;
};

export default ConditionalChatModal; 