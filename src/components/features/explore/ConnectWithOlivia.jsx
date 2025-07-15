import { startOliviaChat } from '../../../utils/olivia'

export default function ConnectWithOlivia() {
  return (
    <div className="border-[#2D394A] bg-[#131820] border-1 border-solid p-0 mt-6 rounded-2xl overflow-hidden relative h-[124px] z-10">
      <div className="flex justify-between items-end h-full">
        {/* Content */}
        <div className="h-full flex flex-col justify-center items-start w-[60%] pl-6">
          <p className="text-white/70 text-[12px] mb-3">
            Connect your X profile and become one of Olivia&apos;s influencers
          </p>
          <button 
            onClick={() => startOliviaChat({
              action: "token_analysis",
              message: `How can I verify my profile as an influencer and what are my benefits?`,
              suggestions: ["View price history", "Check market cap", "Trading volume"],
              sendMessage: true
            })}
            className="text-transparent text-base bg-clip-text bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] font-medium"
          >
            Ask Olivia how
          </button>
        </div>

        {/* Image */}
        <div className="w-1/2 h-full flex justify-end">
          <img 
            src="/OliviaAdvertPose.png" 
            alt="Olivia AI" 
            className="h-full w-30 object-cover object-bottom"
          />
        </div>
      </div>
    </div>
  )
}
