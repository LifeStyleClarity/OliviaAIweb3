// src/components/BottomNavigation.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { Home, Zap, BarChart3, Rocket } from 'lucide-react';
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
        {/* Olivia AI Logo Button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-[#141414] rounded-full border border-white/10">
          <Button
            variant="ghost"
            className="w-14 h-14 min-w-14 p-0 flex flex-col items-center bg-[#141414] rounded-full"
            // This button could have its own logic (e.g., open chat), so we leave it unblocked.
            onPress={() => startOliviaChat({
              action: "quick_chat",
              message: "",
              suggestions: ["Portfolio overview", "Market analysis", "Trading opportunities"],
            })}
          >
            <img
              src="/Olivia-ai-LOGO.png"
              alt="OliviaAI"
              className="w-14 h-14 p-2"
            />
          </Button>
        </div>

        {/* Navigation Bar */}
        <nav className="bg-gradient-to-t from-[#0b090b] to-[#1b1b1b] border-t border-content2 safe-bottom rounded-t-xl">
          <div className="px-2 py-2">
            <div className="grid grid-cols-5 gap-1">
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  fullWidth
                  className="min-w-0 h-auto p-0 flex flex-col items-center"
                  onPress={() => handleNavigation('/')}
                >
                  <Home className={`w-5 h-5 ${location.pathname === '/' ? 'stroke-[#31F46E]' : 'stroke-white'}`} />
                  <span className="text-[10px] mt-0.5">Home</span>
                </Button>
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  fullWidth
                  className="min-w-0 h-auto p-0 flex flex-col items-center"
                  onPress={() => handleNavigation('/explore')}
                >
                  <Zap className={`w-5 h-5 ${location.pathname === '/explore' ? 'stroke-[#31F46E]' : 'stroke-white'}`} />
                  <span className="text-[10px] mt-0.5">Explore</span>
                </Button>
              </div>
              <div className="col-span-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px]">Olivia AI</span>
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  fullWidth
                  className="min-w-0 h-auto p-0 flex flex-col items-center"
                  onPress={() => handleNavigation('/portfolio')}
                >
                  <BarChart3 className={`w-5 h-5 ${location.pathname === '/portfolio' ? 'stroke-[#31F46E]' : 'stroke-white'}`} />
                  <span className="text-[10px] mt-0.5">Portfolio</span>
                </Button>
              </div>
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  fullWidth
                  className="min-w-0 h-auto p-0 flex flex-col items-center"
                  onPress={() => handleNavigation('/game')}
                >
                  <Rocket className={`w-5 h-5 ${location.pathname === '/game' ? 'stroke-[#31F46E]' : 'stroke-white'}`} />
                  <span className="text-[10px] mt-0.5">Game</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
