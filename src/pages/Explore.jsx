import BubbleMapSection from '../components/features/explore/BubbleMapSection'
import ConnectWithOlivia from '../components/features/explore/ConnectWithOlivia'
import TradingInfluencersSection from '../components/features/explore/TradingInfluencersSection'

export default function Explore() {
  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <BubbleMapSection />
      <TradingInfluencersSection />
      <ConnectWithOlivia />
      {/* Blur sphere for visual effect */}
      <div className="absolute -z-0 -top-[500px] -right-[70px] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#206B18]/60 to-[#206B18]/70 blur-3xl" />
    </div>
  )
}
