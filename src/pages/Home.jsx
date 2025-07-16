import PortfolioValue from '../components/features/home/PortfolioValue'
import QuickActions from '../components/features/home/QuickActions'
import TradingTokens from '../components/features/home/TradingTokens'
import TradingInfluencers from '../components/features/home/TradingInfluencers'
import TrendingSentiment from '../components/features/home/TrendingSentiment'

export default function Home() {
  return (
    <div className="flex flex-col gap-6 relative pb-12">
      {/* Blur sphere */}
      <PortfolioValue />
      <QuickActions />
      <TradingTokens />
      <TradingInfluencers />
      <TrendingSentiment />
      <div className="absolute -z-0 -top-[500px] -right-[70px] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#206B18]/60 to-[#206B18]/70 blur-3xl" />
    </div>
  )
}
