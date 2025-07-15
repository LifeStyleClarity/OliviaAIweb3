import { Zap, BarChart3 } from 'lucide-react'
import Button from '../../ui/Button'
import { useNavigate } from 'react-router-dom'
import { startOliviaChat } from '../../../utils/olivia'

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="flex justify-center gap-9 items-center h-fit z-10">
      {/* Explore */}
      <Button 
        variant="ghost"
        className="flex flex-col items-center gap-2 p-0 h-fit"
        onPress={() => navigate('/explore')}
      >
        <div className="w-14 h-14 rounded-full border-[#1B1B1B] border-2 border-solid flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
        <span className="text-xs text-white/70">Explore</span>
      </Button>

      {/* Talk to Olivia */}
      <Button 
        variant="ghost"
        className="flex flex-col items-center gap-2 p-0 h-fit"
        onPress={() => startOliviaChat({
          action: "quick_chat",
          message: "",
          suggestions: ["Portfolio overview", "Market analysis", "Trading opportunities"],
        })}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center">
          <img 
            src="/Olivia-ai-LOGO.png" 
            alt="Olivia AI" 
            className="w-15 h-15"
          />
        </div>
        <span className="text-xs text-white/70">Talk to Olivia</span>
      </Button>

      {/* Portfolio */}
      <Button 
        variant="ghost"
        className="flex flex-col items-center gap-2 p-0 h-fit"
        onPress={() => navigate('/portfolio')}
      >
        <div className="w-14 h-14 rounded-full border-[#1B1B1B] border-2 border-solid flex items-center justify-center">
          <BarChart3 className="w-6 h-6" />
        </div>
        <span className="text-xs text-white/70">Portfolio</span>
      </Button>
    </div>
  )
}
