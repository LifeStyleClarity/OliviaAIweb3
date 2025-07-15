import { ChevronRight, HelpCircle } from 'lucide-react'
import { startOliviaChat } from '../../../utils/olivia'

export default function TrendingSentiment() {
  return (
    <div className="w-full z-10 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-medium">Trending Sentiment</h2>
        <HelpCircle className="w-4 h-4 text-[#4ED342]" />
      </div>

      <button 
        className="w-full flex items-center gap-3 rounded-xl"
        onClick={() => startOliviaChat({
          action: "sentiment_analysis",
          message: "Olivia, what's trending today?",
          suggestions: ["X trending topics", "Telegram signals", "Community sentiment"],
          sendMessage: true
        })}
      >
        <div className="w-12 h-12 min-w-12 min-h-12 rounded-full overflow-hidden">
          <img 
            src="/Olivia-ai-LOGO.png" 
            alt="Olivia AI" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-left w-[80%] text-white/70">
            Ask Olivia AI about trending sentiment and the hottest topics on X or Telegram.
          </span>
        </div>
        <ChevronRight className="w-10 h-10 ml-auto text-white/50" />
        </button>
    </div>
  )
}
