// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletModalComponent from '../ui/ConnectWalletModalComponent';
import { startOliviaChat } from '../../utils/olivia';


export default function BottomNavigation() {
  const { telegramUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // This function handles navigation clicks.
  // If the user is a Telegram user (i.e. hasn't connected a wallet), we show the modal.
  const handleNavigation = (route) => {
    if (telegramUser) {
      setIsConnectModalOpen(true);
    } else {
      navigate(route);
    }
  };

  return (
    <>
      {/* The Connect Wallet Modal */}
      <ConnectWalletModalComponent
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 ">
        {/* Olivia AI Logo Button - Bigger and Pulsing - Higher z-index */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-[#0a0a0a] rounded-full border border-white/10 z-50">
          <Button
            variant="ghost"
            className="w-20 h-20 min-w-20 p-0 flex flex-col items-center bg-[#0a0a0a] rounded-full animate-pulse hover:animate-none"
            onPress={() => startOliviaChat({
              action: "quick_chat",
              message: "",
              suggestions: ["Ask me anything", "Chat with AI", "Get help"],
            })}
          >
            <img
              src="/Olivia-ai-LOGO.png"
              alt="OliviaAI"
              className="w-20 h-20 p-3"
            />
          </Button>
        </div>

        {/* Navigation Bar - Taller and Transparent */}
        <nav className="bg-transparent backdrop-blur-sm border-t border-white/10 safe-bottom rounded-t-xl">
          <div className="px-2 py-6">
            <div className="flex justify-center items-center">
              <div className="flex-1 flex flex-col items-center justify-end h-full">
              </div>
            </div>
          </div>
        </nav>
      </div>
      
      {/* Additional CSS for enhanced pulse effect */}
      <style jsx>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
