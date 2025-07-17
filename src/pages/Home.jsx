import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useChatContext } from '../contexts/ChatContext'
import { setChatOpenCallback } from '../utils/olivia'
import { useAccountUpgrade } from '../hooks/useAccountUpgrade';

export default function Home() {
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChatContext()
  const [messages, setMessages] = useState([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [loadingText, setLoadingText] = useState('Analyzing')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  const inputRef = useRef(null)
  const { userData, isGuestUser } = useAuth()
  const { isConnected, sendMessage, subscribe, connect } = useWebSocket()
  const { forceShowUpgrade } = useAccountUpgrade(); // ICP upgrade

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Initialize particles
  useEffect(() => {
    const createParticles = () => {
      const newParticles = []
      for (let i = 0; i < 20; i++) { // Reduced from 50 to 20 particles
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          size: Math.random() * 2 + 1.5
        })
      }
      setParticles(newParticles)
    }
    
    createParticles()
    window.addEventListener('resize', createParticles)
    return () => window.removeEventListener('resize', createParticles)
  }, [])

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        // Calculate distance to mouse
        const dx = mousePos.x - particle.x
        const dy = mousePos.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Simplified attraction to mouse
        const force = Math.min(distance / 150, 2)
        const attractionX = distance > 0 ? (dx / distance) * force * 0.05 : 0
        const attractionY = distance > 0 ? (dy / distance) * force * 0.05 : 0
        
        // Simplified random movement
        const randomX = (Math.random() - 0.5) * 0.3
        const randomY = (Math.random() - 0.5) * 0.3
        
        // Update velocity with more damping
        let newVx = (particle.vx + attractionX + randomX) * 0.9
        let newVy = (particle.vy + attractionY + randomY) * 0.9
        
        // Update position
        let newX = particle.x + newVx
        let newY = particle.y + newVy
        
        // Wrap around screen edges
        if (newX < 0) newX = window.innerWidth
        if (newX > window.innerWidth) newX = 0
        if (newY < 0) newY = window.innerHeight
        if (newY > window.innerHeight) newY = 0
        
        return {
          ...particle,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy
        }
      }))
    }
    
    const interval = setInterval(animateParticles, 33) // Reduced to ~30fps
    return () => clearInterval(interval)
  }, [mousePos])

  // Cycling loading text
  useEffect(() => {
    if (!isLoading) return
    
    const loadingStates = ['Analyzing', 'Researching', 'Processing', 'Searching', 'Thinking']
    let currentIndex = 0
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingStates.length
      setLoadingText(loadingStates[currentIndex])
    }, 800)
    
    return () => clearInterval(interval)
  }, [isLoading])

  // Handle WebSocket messages
  useEffect(() => {
    if (!isChatOpen) return

    const handleMessage = (data) => {
      console.log('📨 Received message:', data)
      
      if (data.type === 'stream_chunk') {
        setCurrentResponse(prev => prev + (data.data?.text || data.content || ''))
        setIsLoading(false)
      } else if (data.type === 'stream_complete') {
        const finalResponse = data.data?.fullResponse || data.data?.text || currentResponse
        setMessages(prev => [...prev, { type: 'ai', content: finalResponse }])
        setCurrentResponse('')
        setIsLoading(false)
        // Show input after response is complete
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'response') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'text') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      }
    }

    const unsubscribe = subscribe(handleMessage)
    return () => unsubscribe()
  }, [isChatOpen, subscribe, currentResponse])

  // Focus input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  // Handle sending user message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }])
    setUserInput('')
    setShowInput(false)
    setIsLoading(true)
    setCurrentResponse('')

    // Send message to Olivia
    await sendMessage(message)
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Register the chat open callback
  useEffect(() => {
    setChatOpenCallback(async (shouldOpen) => {
      if (shouldOpen) {
        setIsChatOpen(true)
        setIsLoading(true)
        setMessages([])
        setCurrentResponse('')
        setShowInput(false)
        setUserInput('')
        
        // Connect to WebSocket if not connected
        if (!isConnected) {
          await connect()
        }
        
        // Send a simple message to get response
        setTimeout(() => {
          sendMessage('Do a web search for trending tokens and the latest crypto news. Present it as if you\'re giving me the inside scoop on what\'s happening today in the market. Speak like you\'re already deep in the charts — confident, sharp, and human. No intros, no greetings. Just drop straight into what you\'re seeing and what I should be watching.')
        }, 1000)
      } else {
        setIsChatOpen(false)
        setMessages([])
        setCurrentResponse('')
        setIsLoading(false)
        setShowInput(false)
        setUserInput('')
      }
    })
  }, [setIsChatOpen, isConnected, connect, sendMessage])

  return (
    <div className="flex flex-col gap-6 relative pb-12 min-h-screen overflow-hidden">
              {/* Temporary Test Button - Remove this later */}
        {import.meta.env.DEV && (
          <button
            onClick={() => {
              console.log('🧪 Test button clicked!', { isGuestUser, userData });
              forceShowUpgrade();
            }}
            className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          >
            Test ICP Upgrade
          </button>
        )}
      {/* Animated Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute bg-green-300 rounded-full opacity-60"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

      {/* Conversation Display - Center of Screen */}
      {isChatOpen && (
        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
          <div className="text-center max-w-xl w-full">
            
            {/* Chat Messages */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`text-sm transition-all duration-500 ${
                    msg.type === 'user' 
                      ? 'text-green-300 opacity-70' 
                      : 'text-white opacity-90'
                  }`}
                  style={{
                    transform: `translateY(${-index * 2}px)`,
                    opacity: Math.max(0.3, 1 - (index * 0.1))
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Current Response or Loading */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/60 rounded-full animate-pulse"
                      style={{
                        height: '20px',
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
                <div className="text-white/80 text-sm">
                  {loadingText}...
                </div>
              </div>
            ) : currentResponse ? (
              <div className="text-white text-sm opacity-90">
                {currentResponse}
              </div>
            ) : messages.length === 0 && (
              <div className="text-white/50 text-sm">
                Starting conversation...
              </div>
            )}
            
            {/* Simple Input */}
            {showInput && (
              <div className="fixed bottom-32 left-4 right-4 z-20">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-black border border-green-300 rounded-lg text-white text-sm px-3 py-2 text-center focus:outline-none focus:border-green-400"
                  style={{
                    caretColor: 'white'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
