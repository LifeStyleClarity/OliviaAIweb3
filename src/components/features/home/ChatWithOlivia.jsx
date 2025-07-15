import { startOliviaChat } from '../../../utils/olivia'

export default function ChatWithOlivia() {
  return (
    <div className="border-[#2D394A] bg-[#131820] border-1 border-solid p-0 mt-6 rounded-2xl overflow-hidden relative h-[180px] z-10">
      <div className="flex justify-between items-end h-full">
        {/* Image */}
        <div className="w-1/2 h-full">
          <img 
            src="/OliviaPose.png" 
            alt="Olivia AI" 
            className="h-full w-30 object-cover object-bottom"
          />
        </div>
        
        {/* Content */}
        <div className=" mb-2 h-full flex flex-col justify-center items-start w-[60%]">
          <h2 className="text-base font-regular mb-2">Chat with Olivia</h2>
          <p className="text-white/70 text-xs mb-3">
            Start your conversation with Olivia and earn <span className="text-white">10 ONAI pts</span> each interaction.
          </p>
          <button 
            onClick={startOliviaChat}
            className="text-transparent text-base bg-clip-text bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] font-medium"
          >
            Chat Now!
          </button>
        </div>

        
      </div>
    </div>
  )
}
