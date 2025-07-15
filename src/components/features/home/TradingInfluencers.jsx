import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOliviaChat } from '../../../utils/olivia';
import { ChevronRight } from 'lucide-react';
import { socialService } from '../../../api';

export default function TradingInfluencers() {
  const navigate = useNavigate();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await socialService.getInfluencers();
        // Get top 3 influencers with their most mentioned cashtag
        const topInfluencers = data
          .slice(0, 3)
          .map(({ influencer, cashtags }) => ({
            id: influencer.id,
            name: influencer.username,
            handle: `@${influencer.username}`,
            image: influencer.avatar_image,
            tag: cashtags?.length > 0 ? `$${cashtags[0].cashtag}` : '$TON',
            tagColor: '#4ED342' // Keep consistent green color
          }));
        setInfluencers(topInfluencers);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 z-10 mt-6">
          <h2 className="text-sm font-medium">Explore Trading Influencers</h2>
          <button className="text-xs text-white/70">View all</button>
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-700"></div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-3 w-24 bg-gray-700 rounded"></div>
                <div className="h-2 w-20 bg-gray-700 rounded"></div>
                <div className="h-5 w-16 bg-gray-700/20 rounded-full mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 z-10 mt-6">
        <h2 className="text-sm font-medium">Explore Trading Influencers</h2>
        <button 
          className="text-xs text-white/70"
          onClick={() => navigate('/explore')}
        >
          View all
        </button>
      </div>

      <div className="">
        <div className="flex flex-col gap-4">
          {influencers.map(influencer => (
            <button 
              key={influencer.id}
              className="flex items-center gap-3 p-2 rounded-xl"
              onClick={() => startOliviaChat({
                action: "influencer_analysis",
                message: `Whatt ${influencer.handle}'s is twetting?`,
                suggestions: ["Recent trades", "Performance history", "Trading strategy"],
                sendMessage: true
              })}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-[#1B1B1B] border-solid border-2">
                <img 
                  src={influencer.image}
                  alt={influencer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <div className='flex justify-start flex-col items-start'>
                  <span className="text-xs font-medium">{influencer.name}</span>
                  <span className="text-[10px] text-white/70">{influencer.handle}</span>
                </div>
                <div 
                  className="text-[10px] px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${influencer.tagColor}20`,
                    color: influencer.tagColor 
                  }}
                >
                  {influencer.tag}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-white/50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
