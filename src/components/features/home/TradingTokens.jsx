import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOliviaChat } from '../../../utils/olivia';
import { socialService } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

export default function TradingTokens() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isGuestUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For guest users, provide mock data or skip API calls
        if (isGuestUser) {
          setTokens([
            { id: 1, name: 'TON', image: '/tonicon.webp', mentions: 1200 },
            { id: 2, name: 'BTC', image: '/tonicon.webp', mentions: 800 },
            { id: 3, name: 'ETH', image: '/tonicon.webp', mentions: 650 },
            { id: 4, name: 'USDT', image: '/tonicon.webp', mentions: 400 }
          ]);
        } else {
        const topTokens = await socialService.getTopMentionedTokens(4);
        setTokens(topTokens.map(token => ({
          id: token.data.id,
          name: token.data.token_symbol,
          image: token.data.token_icon,
          mentions: token.totalMentions || 0
        })));
        }
      } catch (error) {
        // Silently handle errors for guest users
        if (!isGuestUser) {
          console.error("Error fetching trading tokens:", error);
        }
        // Fallback to mock data
        setTokens([
          { id: 1, name: 'TON', image: '/tonicon.webp', mentions: 1200 },
          { id: 2, name: 'BTC', image: '/tonicon.webp', mentions: 800 },
          { id: 3, name: 'ETH', image: '/tonicon.webp', mentions: 650 },
          { id: 4, name: 'USDT', image: '/tonicon.webp', mentions: 400 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isGuestUser]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 z-10 mt-6">
          <h2 className="text-sm font-medium">Explore Trading Tokens</h2>
          <button className="text-xs text-white/70">View all</button>
        </div>
        <div className="border-[#1B1B1B] border-2 border-solid rounded-2xl p-2">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-black/20 rounded-xl p-2 flex flex-col items-center gap-1 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="h-3 w-12 bg-gray-700 rounded"></div>
                <div className="h-2 w-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 z-10 mt-6">
        <h2 className="text-sm font-medium">Trending Tokens</h2>
        <button 
          className="text-xs text-white/70"
          onClick={() => navigate('/explore')}
        >
          View all
        </button>
      </div>

      <div className="border-[#1B1B1B] border-2 border-solid rounded-2xl p-2">
        <div className="grid grid-cols-4 gap-2">
          {tokens.map(token => (
            <button 
              key={token.id}
              className="bg-black/20 rounded-xl p-2 flex flex-col items-center gap-1"
              onClick={() => startOliviaChat({
                action: "token_analysis",
                message: `Can you tell me more about $${token.name} token`,
                suggestions: ["View price history", "Check market cap", "Trading volume"],
                sendMessage: true
              })}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-[#1B1B1B] border-solid border-2">
                <img 
                  src={token.image}
                  alt={token.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-medium">{token.name}</span>
              <span className="text-[8px] text-[#4ED342]">
                {token.mentions} mentions
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
