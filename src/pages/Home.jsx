import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useChatContext } from '../contexts/ChatContext'
import { setChatOpenCallback } from '../utils/olivia'
import { useAccountUpgrade } from '../hooks/useAccountUpgrade';
import { lurkyService, coingeckoService, coinstatsService, hgraphService, changeNowService } from '../api';
import FloatingLurkyBubble from '../components/ui/FloatingLurkyBubble.jsx';
import FloatingCoinGeckoBubble from '../components/ui/FloatingCoinGeckoBubble.jsx';
import FloatingCoinStatsBubble from '../components/ui/FloatingCoinStatsBubble.jsx';
import FloatingICPBubble from '../components/ui/FloatingICPBubble.jsx';
import FloatingHederaBubble from '../components/ui/FloatingHederaBubble.jsx';
import FloatingChangeNowBubble from '../components/ui/FloatingChangeNowBubble.jsx';

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
  // Multiple bubble instances - arrays instead of single states
  const [lurkyBubbles, setLurkyBubbles] = useState([])
  const [coinGeckoBubbles, setCoinGeckoBubbles] = useState([])
  const [coinstatsBubbles, setCoinstatsBubbles] = useState([])
  const [icpBubbles, setIcpBubbles] = useState([])
  const [hederaBubbles, setHederaBubbles] = useState([])
  const [changeNowBubbles, setChangeNowBubbles] = useState([])
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
      for (let i = 0; i < 15; i++) { // Reduced to 15 background particles
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          size: Math.random() * 2 + 1.5,
          life: Infinity, // Background particles live forever
          createdAt: Date.now()
        })
      }
      setParticles(newParticles)
    }
    
    createParticles()
    window.addEventListener('resize', createParticles)
    return () => window.removeEventListener('resize', createParticles)
  }, [])

  // Animate particles with performance optimizations
  useEffect(() => {
    let frameId;
    const MAX_PARTICLES = 100; // Hard limit on particles
    const PARTICLE_LIFETIME = 8000; // 8 seconds for pop particles
    
    const animateParticles = () => {
      setParticles(prev => {
        const now = Date.now();
        
        // Clean up old particles and enforce limits
        let aliveParticles = prev.filter(particle => 
          particle.life === Infinity || (now - particle.createdAt < particle.life)
        );
        
        // If we have too many particles, remove oldest non-background particles first
        if (aliveParticles.length > MAX_PARTICLES) {
          const backgroundParticles = aliveParticles.filter(p => p.life === Infinity);
          const popParticles = aliveParticles.filter(p => p.life !== Infinity)
            .sort((a, b) => a.createdAt - b.createdAt) // Oldest first
            .slice(0, MAX_PARTICLES - backgroundParticles.length);
          
          aliveParticles = [...backgroundParticles, ...popParticles];
        }
        
        // Simplified physics - only calculate mouse attraction for nearby particles
        return aliveParticles.map(particle => {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distanceSquared = dx * dx + dy * dy; // Skip expensive sqrt
          
          let attractionX = 0, attractionY = 0;
          
          // Only apply attraction if particle is within reasonable distance (performance boost)
          if (distanceSquared < 40000) { // ~200px radius
            const distance = Math.sqrt(distanceSquared);
            const force = Math.min(distance / 200, 1.5);
            attractionX = distance > 0 ? (dx / distance) * force * 0.03 : 0;
            attractionY = distance > 0 ? (dy / distance) * force * 0.03 : 0;
          }
          
          // Simpler random movement
          const randomX = (Math.random() - 0.5) * 0.2;
          const randomY = (Math.random() - 0.5) * 0.2;
          
          // Update velocity with damping
          const newVx = (particle.vx + attractionX + randomX) * 0.92;
          const newVy = (particle.vy + attractionY + randomY) * 0.92;
          
          // Update position
          let newX = particle.x + newVx;
          let newY = particle.y + newVy;
          
          // Simplified boundary handling
          if (newX < 0) newX = window.innerWidth;
          else if (newX > window.innerWidth) newX = 0;
          if (newY < 0) newY = window.innerHeight;
          else if (newY > window.innerHeight) newY = 0;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });
      });
      
      frameId = requestAnimationFrame(animateParticles);
    };
    
    frameId = requestAnimationFrame(animateParticles);
    return () => cancelAnimationFrame(frameId);
  }, [mousePos])

  // Function to add particles to the main swarm (for bubble pops)
  const addParticlesToSwarm = (newParticles) => {
    setParticles(prev => {
      const now = Date.now();
      
      // Convert pop particles to swarm particles with lifecycle
      const swarmParticles = newParticles.map((particle, index) => ({
        id: now + index + Math.random(), // Unique ID
        x: particle.x,
        y: particle.y,
        vx: particle.vx * 0.15, // Reduced initial velocity for smoother integration
        vy: particle.vy * 0.15,
        size: particle.size,
        life: 6000, // Pop particles live for 6 seconds
        createdAt: now
      }));
      
      return [...prev, ...swarmParticles];
    });
  };

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

  // Monitor console for ICP errors
  useEffect(() => {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Check for ICP-related errors
      if (message.includes('ICP network not available') || 
          message.includes('ICP Service:') ||
          message.includes('net::ERR_CONNECTION_REFUSED') && message.includes('4943')) {
        
        // Only create ICP bubble if none exists
        setIcpBubbles(prev => {
          if (prev.length === 0) {
            // Create the first and only ICP bubble
            const newIcpBubble = {
              id: Date.now() + Math.random(),
              title: 'ICP Status',
              content: '🔴 ICP Network\nDisconnected\n\nDev Mode:\nNo Local Replica',
              status: 'error',
              loading: false
            }
            return [newIcpBubble];
          }
          // If bubble already exists, don't add another one
          return prev;
        });
        
        // Keep bubble visible - no auto-hide for bubble map
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, [])

  // Handle sending user message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    
    // Extract potential token names from the message
    // Look for words that could be tokens (3+ chars, not common words)
    const words = message.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
    const commonWords = ['the', 'and', 'for', 'with', 'what', 'how', 'why', 'when', 'where', 'this', 'that', 'are', 'you', 'can', 'get', 'buy', 'sell', 'trade', 'swap', 'exchange', 'price', 'coin', 'token', 'crypto', 'cryptocurrency'];
    
    const potentialTokens = words.filter(word => 
      word.length >= 3 && 
      !commonWords.includes(word) &&
      !/^\d+$/.test(word) // Not just numbers
    );
    
    // Use the first potential token found
    const mentionedCoin = potentialTokens[0];
    
    // Detect price queries
    const mentionsPrice = /\b(price|prices|cost|value|worth|usd|dollar)\b/i.test(message)
    
    // Detect Hedera mentions
    const mentionsHedera = /\b(hedera|hbar|hashgraph|hgraph)\b/i.test(message)
    
    // Detect CoinStats mentions (coin and price triggers)
    const mentionsCoinstats = /\b(coin|coins|price|prices)\b/i.test(message)
    
    // Detect ChangeNOW mentions (buy and swap triggers)
    const mentionsChangeNow = /\b(buy|swap|exchange|trade|convert)\b/i.test(message)
    
    // Add user message to conversation
    setMessages(prev => [...prev, { type: 'user', content: message }])
    setUserInput('')
    setShowInput(false)
    setIsLoading(true)
    setCurrentResponse('')

    // Handle Lurky bubble logic (coin mentions)
    if (mentionedCoin) {
      // Create new Lurky bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: `${mentionedCoin.toUpperCase()} - Lurky`,
        content: 'Loading coin data...',
        loading: true
      }
      
      setLurkyBubbles(prev => [...prev, newBubble])
      
      // Then try to fetch data
      ;(async () => {
        try {
          const data = await lurkyService.getCoins(mentionedCoin)
          
          // Debug log to see what we actually get
          console.log('Lurky API Response:', data);
          console.log('Lurky API Response type:', typeof data);
          console.log('Lurky API Response keys:', data ? Object.keys(data) : 'no keys');
          
          let lurkyText = '';
          
          // Convert data to string if it's showing as [object Object]
          if (data && typeof data === 'object' && data.toString() === '[object Object]') {
            lurkyText = `📊 Lurky API Debug:\n\nType: ${typeof data}\nKeys: ${Object.keys(data).join(', ')}\n\nRaw data:\n${JSON.stringify(data, null, 2)}`;
          } else if (!data || typeof data !== 'object') {
            lurkyText = `❌ Invalid response from Lurky API\n\nReceived: ${typeof data}\nData: ${String(data)}`;
          } else if (data.message) {
            // Handle API errors/messages
            lurkyText = `⚠️ ${data.message}\n\n${data.suggestion || ''}`;
          } else if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
            const coin = data.coins[0];
            
            lurkyText = `📊 ${coin.name || coin.symbol} Social Data\n\n`;
            
            if (coin.sentiment) {
              const sentiment = coin.sentiment.toLowerCase();
              const emoji = sentiment === 'bullish' ? '🟢' : sentiment === 'bearish' ? '🔴' : '🟡';
              lurkyText += `${emoji} Sentiment: ${coin.sentiment}\n`;
            }
            
            if (coin.mentions) {
              lurkyText += `💬 Mentions: ${coin.mentions}\n`;
            }
            
            if (coin.rank) {
              lurkyText += `🏆 Rank: #${coin.rank}\n`;
            }
            
            if (coin.change_24h) {
              const changeEmoji = coin.change_24h > 0 ? '📈' : '📉';
              lurkyText += `${changeEmoji} 24h Change: ${coin.change_24h}%\n`;
            }
            
            if (coin.volume_24h) {
              lurkyText += `📊 Volume: $${coin.volume_24h.toLocaleString()}\n`;
            }
            
            if (coin.social_score) {
              lurkyText += `🔥 Social Score: ${coin.social_score}/100\n`;
            }
            
            lurkyText += `\n📱 Social sentiment powered by Lurky`;
            
          } else if (data.filtered_for) {
            lurkyText = `🔍 No data found for "${data.filtered_for}"\n\nTry popular coins like:\n• Bitcoin\n• Ethereum\n• Solana\n• Dogecoin`;
          } else if (data.coins && Array.isArray(data.coins) && data.coins.length === 0) {
            lurkyText = `📊 No coin data available\n\nThe Lurky API returned an empty list.\nTry asking about:\n• Bitcoin\n• Ethereum\n• Popular trending coins`;
          } else if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
            lurkyText = `📊 Top Social Mentions:\n\n`;
            data.coins.slice(0, 5).forEach((coin, index) => {
              const emoji = coin.sentiment === 'bullish' ? '🟢' : coin.sentiment === 'bearish' ? '🔴' : '🟡';
              const name = coin.name || coin.symbol || `Coin ${index + 1}`;
              lurkyText += `${index + 1}. ${emoji} ${name}`;
              if (coin.mentions) lurkyText += ` (${coin.mentions} mentions)`;
              lurkyText += `\n`;
            });
            lurkyText += `\n📱 Powered by Lurky`;
          } else {
              // Show raw data in readable format
              lurkyText = `📊 Lurky API Response:\n\n`;
              
              if (typeof data === 'string') {
                lurkyText += data;
              } else {
                // Try to extract any useful information from the response
                Object.keys(data).forEach(key => {
                  const value = data[key];
                  if (value !== null && value !== undefined) {
                    if (typeof value === 'object') {
                      lurkyText += `${key}: ${JSON.stringify(value, null, 1)}\n\n`;
                    } else {
                      lurkyText += `${key}: ${value}\n`;
                    }
                  }
                });
              }
            }
          
          // Update the specific bubble
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: lurkyText, loading: false }
              : bubble
          ))
        } catch (e) {
          const errorContent = e.response?.status === 401
            ? `🔑 Lurky API Key Expired\n\nThe API key needs to be renewed to fetch ${mentionedCoin} data.\n\nContact support for a new key.`
            : `❌ Failed to fetch ${mentionedCoin} data from Lurky.\n\nError: ${e.message || 'Unknown error'}`
          
          // Update the specific bubble with error
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep Lurky bubble visible - building conversation bubble map

    // Handle CoinGecko bubble logic (price mentions)
    if (mentionsPrice) {
      // Create new CoinGecko bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: 'Live Prices - CoinGecko',
        content: 'Loading price data...',
        loading: true
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          const data = await coingeckoService.getPrices(['bitcoin', 'ethereum', 'solana'])
          let priceText = ''
          Object.entries(data).forEach(([coin, info]) => {
            const change = info.usd_24h_change || 0
            const changeEmoji = change > 0 ? '📈' : '📉'
            const price = info.usd > 1000 ? `${(info.usd/1000).toFixed(0)}k` : 
                         info.usd > 1 ? info.usd.toFixed(0) : 
                         info.usd.toFixed(3)
            const symbol = coin === 'bitcoin' ? 'BTC' : 
                          coin === 'ethereum' ? 'ETH' : 
                          coin === 'solana' ? 'SOL' : coin.slice(0,3).toUpperCase()
            priceText += `${changeEmoji}${symbol} $${price}\n${change.toFixed(1)}%\n`
          })
          // Update the specific bubble
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: priceText, loading: false }
              : bubble
          ))
        } catch (e) {
          // Update the specific bubble with error
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: 'Failed to fetch price data from CoinGecko.', loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep CoinGecko bubble visible - building conversation bubble map

    // Handle CoinStats bubble logic (specific token search)
    if (mentionsCoinstats) {
      // Improved token detection - prioritize context and "price of X" patterns
      let detectedToken = null;
      
      // First, look for "price of X", "X price", "show me X" patterns
      const contextPatterns = [
        /(?:price of|price for|cost of|value of)\s+([a-zA-Z]+)/i,
        /(?:show me|get|check|find)\s+([a-zA-Z]+)(?:\s+price|\s+coin|\s+token)?/i,
        /([a-zA-Z]+)\s+(?:price|cost|value)$/i,
        /\$([a-zA-Z]+)/i
      ];
      
      for (const pattern of contextPatterns) {
        const match = message.match(pattern);
        if (match && match[1] && match[1].length >= 3) {
          const token = match[1].toLowerCase();
          // Verify it's a valid token name (not a common word)
          if (!['the', 'and', 'for', 'with', 'what', 'how', 'why', 'when', 'where'].includes(token)) {
            detectedToken = token;
            break;
          }
        }
      }
      
      // If context patterns didn't work, use our dynamic token detection
      if (!detectedToken && potentialTokens.length > 0) {
        // Prioritize tokens that appear after action words like "price", "buy", etc.
        const actionWords = ['price', 'buy', 'sell', 'trade', 'swap', 'exchange', 'get', 'check'];
        
        for (let i = 0; i < words.length; i++) {
          if (actionWords.includes(words[i]) && i + 1 < words.length) {
            const nextWord = words[i + 1];
            if (potentialTokens.includes(nextWord)) {
              detectedToken = nextWord;
              break;
            }
          }
        }
        
        // If no token found after action words, use the first potential token
        if (!detectedToken) {
          detectedToken = potentialTokens[0];
        }
      }
      
      // Create new CoinStats bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: detectedToken ? `${detectedToken.toUpperCase()} - CoinStats` : 'Token Search - CoinStats',
        content: detectedToken ? `Searching for ${detectedToken.toUpperCase()}...` : 'Searching for token...',
        loading: true
      }
      
      setCoinstatsBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          let tokenText = '';
          
          if (detectedToken) {
            // Try to search for the specific token
            try {
              const searchData = await coinstatsService.searchCoins(detectedToken);
              
              if (searchData.result && searchData.result.length > 0) {
                const coin = searchData.result[0]; // Get first result
                const change = coin.priceChange1d || 0;
                const changeEmoji = change > 0 ? '📈' : '📉';
                const price = coin.price > 1000 ? `${(coin.price/1000).toFixed(2)}k` : coin.price.toFixed(4);
                const marketCap = coin.marketCap ? `$${(coin.marketCap/1e9).toFixed(2)}B` : 'N/A';
                const volume = coin.volume ? `$${(coin.volume/1e6).toFixed(1)}M` : 'N/A';
                
                tokenText = `${changeEmoji} ${coin.name} (${coin.symbol})\n\n`;
                tokenText += `💰 Price: $${price}\n`;
                tokenText += `📊 24h: ${change.toFixed(2)}%\n`;
                tokenText += `🏛️ Market Cap: ${marketCap}\n`;
                tokenText += `💹 Volume: ${volume}\n`;
                tokenText += `📈 Rank: #${coin.rank || 'N/A'}`;
              } else {
                tokenText = `🔍 Token "${detectedToken.toUpperCase()}" not found\n\nTry searching for:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Solana (SOL)\n• Popular tokens`;
              }
            } catch (searchError) {
              console.error('Token search failed:', searchError);
              tokenText = `❌ "${detectedToken.toUpperCase()}" not found\n\nDouble-check the token name or try:\n• Bitcoin → "bitcoin price"\n• Ethereum → "eth price"\n• Solana → "solana price"`;
            }
          } else {
            // No specific token detected
            tokenText = `🔍 No specific token detected\n\nPlease specify a token:\n• "bitcoin price"\n• "ethereum price" \n• "solana price"\n• "cardano price"`;
          }
          
          // Update the specific bubble
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: tokenText, loading: false }
              : bubble
          ))
        } catch (e) {
          console.error('CoinStats error:', e)
          // Update the specific bubble with error
          setCoinstatsBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `❌ CoinStats API Error\n\nTry asking for:\n• "bitcoin price"\n• "ethereum coin"\n• "solana price"`, loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep CoinStats bubble visible - building conversation bubble map

    // Handle Hedera bubble logic (hedera mentions)
    if (mentionsHedera) {
      const hederaBubbleId = Date.now() + Math.random()
      
      // Add loading bubble immediately
      setHederaBubbles(prev => [...prev, {
        id: hederaBubbleId,
        title: 'Hedera Network - Hgraph',
        content: '',
        loading: true
      }])
      
      ;(async () => {
        try {
          const data = await hgraphService.getHederaOverview()
          
          let hederaText = ''
          
          // Format HBAR price data
          if (data.price) {
            const price = data.price.usd || 0
            const change = data.price.usd_24h_change || 0
            const changeEmoji = change > 0 ? '📈' : '📉'
            const marketCap = data.price.usd_market_cap || 0
            
            hederaText += `${changeEmoji} HBAR $${price.toFixed(4)}\n`
            hederaText += `24h: ${change.toFixed(2)}%\n`
            hederaText += `Cap: $${(marketCap / 1e9).toFixed(2)}B\n\n`
          }
          
          // Format network data
          if (data.network) {
            hederaText += `🌐 Network Status\n`
            hederaText += `Total Supply: ${(data.network.total_supply / 1e8).toFixed(0)}B HBAR\n`
          }
          
          // Format recent transactions
          if (data.transactions && data.transactions.transactions) {
            hederaText += `\n⚡ Recent Activity\n`
            hederaText += `Latest TXs: ${data.transactions.transactions.length}\n`
          }
          
          if (!hederaText) {
            hederaText = 'Hedera network data loaded successfully!'
          }
          
          // Update the bubble with content
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === hederaBubbleId 
              ? { ...bubble, content: hederaText, loading: false }
              : bubble
          ))
        } catch (e) {
          // Update the bubble with error content
          setHederaBubbles(prev => prev.map(bubble => 
            bubble.id === hederaBubbleId 
              ? { ...bubble, content: 'Failed to fetch Hedera data from Hgraph API.', loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep Hedera bubble visible - building conversation bubble map

    // Handle ChangeNOW bubble logic (buy/swap mentions)
    if (mentionsChangeNow && mentionedCoin) {
      // Create new ChangeNOW bubble instance
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: `${mentionedCoin.toUpperCase()} Exchange - ChangeNOW`,
        content: `Getting exchange data for ${mentionedCoin.toUpperCase()}...`,
        loading: true
      }
      
      setChangeNowBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // For "buy [token]" - user wants to buy the token with USDT (USDT -> Token)
          const exchangeInfo = await changeNowService.getExchangeInfo('usdt', mentionedCoin, 1);
          
          let exchangeText = '';
          
          if (exchangeInfo.fromCurrency && exchangeInfo.toCurrency) {
            const fromToken = exchangeInfo.fromCurrency;
            const toToken = exchangeInfo.toCurrency;
            
            exchangeText = `🔄 Buy ${toToken.name} (${toToken.ticker.toUpperCase()}) with USDT\n\n`;
            
            // Minimum exchange amount
            if (exchangeInfo.minAmount) {
              exchangeText += `💰 Minimum: ${exchangeInfo.minAmount.minAmount} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange range (limits)
            if (exchangeInfo.exchangeRange) {
              const range = exchangeInfo.exchangeRange;
              exchangeText += `📊 Limits: ${range.minAmount || 'N/A'} - ${range.maxAmount || 'Unlimited'} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange rate and fees
            if (exchangeInfo.exchangeAmount) {
              const rate = exchangeInfo.exchangeAmount;
              exchangeText += `💱 Rate: 1 ${fromToken.ticker.toUpperCase()} = ${rate.estimatedAmount} ${toToken.ticker.toUpperCase()}\n`;
            }
            
            // Market info (fees and processing time)
            if (exchangeInfo.marketInfo) {
              const market = exchangeInfo.marketInfo;
              if (market.fee !== undefined) {
                exchangeText += `💳 Fee: ${(market.fee * 100).toFixed(2)}%\n`;
              }
              if (market.flow) {
                exchangeText += `⚡ Flow: ${market.flow}\n`;
              }
            }
            
            exchangeText += `\n⏱️ Processing: ~5-30 minutes\n`;
            exchangeText += `🌐 Cross-chain swaps available\n\n`;
            // For "buy [token]" - user wants to buy the token with USDT (USDT -> Token)
            exchangeText += `🔗 Ready to swap?\nVisit: https://changenow.io\nSwap: ${fromToken.ticker.toUpperCase()} → ${toToken.ticker.toUpperCase()}`;
            
          } else {
            exchangeText = `❌ "${mentionedCoin.toUpperCase()}" not available for exchange\n\nTry popular tokens like:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Solana (SOL)\n• Cardano (ADA)`;
          }
          
          // Update the specific bubble
          setChangeNowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: exchangeText, loading: false }
              : bubble
          ))
        } catch (e) {
          console.error('ChangeNOW error:', e)
          // Update the specific bubble with error
          setChangeNowBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `❌ ChangeNOW API Error\n\nCouldn't fetch exchange data for ${mentionedCoin.toUpperCase()}\n\nTry asking for:\n• "buy bitcoin"\n• "swap ethereum"\n• "trade solana"`, loading: false }
              : bubble
          ))
        }
      })()
    }
    // Keep ChangeNOW bubble visible - building conversation bubble map

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
        setIsLoading(false) // Don't show loading initially
        setMessages([{
          type: 'ai',
          content: "Hey there, I've got some interesting stuff I've found! Let me show you."
        }]) // Show instant greeting
        setCurrentResponse('')
        setShowInput(false)
        setUserInput('')
        
        // Show thinking indicator after greeting, then send hidden message
        setTimeout(async () => {
          console.log('🤔 Home.jsx: Starting thinking indicator and message send process...');
          setIsLoading(true) // Show thinking indicator after greeting
          
          console.log('🔍 Home.jsx: WebSocket status:', { isConnected });
          
          // Always try to connect (it's safe to call multiple times)
          console.log('🔌 Home.jsx: Ensuring WebSocket connection...');
          await connect();
          console.log('✅ Home.jsx: Connect function called');
          
          // Wait briefly for the connection event to trigger
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('📤 Home.jsx: Attempting to send message directly...');
          
          try {
            const result = await sendMessage('hey who are you and what day is it');
            console.log('📨 Home.jsx: Send message result:', result);
            
            if (!result) {
              console.error('❌ Home.jsx: Send message returned false, stopping loading');
              setIsLoading(false);
            }
          } catch (error) {
            console.error('❌ Home.jsx: Error sending message:', error);
            setIsLoading(false); // Stop loading on error
          }
        }, 500) // Show thinking after 500ms
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
    <div className="flex flex-col gap-6 relative h-screen overflow-hidden">
      
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

      {/* Conversation Display - Just Above Input */}
      {isChatOpen && (
        <div className="flex-1 flex items-end justify-center px-4 relative z-10 pb-56">
          <div className="text-center max-w-xl w-full">
            
            {/* Chat Messages - Fade to black and disappear, positioned above input */}
            <div className="space-y-3 mb-6 overflow-hidden" style={{ maxHeight: '40vh' }}>
              {messages.map((msg, index) => {
                // Calculate fade: newest messages (highest index) = 100% opacity
                // Older messages (lower index) = fade to black and disappear
                const totalMessages = messages.length;
                const messageAge = totalMessages - index - 1; // 0 = newest, higher = older
                const fadeOpacity = Math.max(0, 1 - (messageAge * 0.15)); // Fade to 0 (black/gone)
                
                // Don't render messages that are completely faded
                if (fadeOpacity <= 0.05) return null;
                
                return (
                  <div 
                    key={index}
                    className={`text-sm transition-all duration-500 ${
                      msg.type === 'user' 
                        ? 'text-green-300' 
                        : 'text-white'
                    }`}
                    style={{
                      opacity: fadeOpacity
                    }}
                  >
                    {msg.content}
                  </div>
                );
              }).filter(Boolean)}
            </div>

            {/* Current Response or Loading */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <img 
                  src="/THINKING ICON.gif" 
                  alt="Thinking" 
                  className="w-12 h-12"
                />
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
      {/* Render all Lurky bubble instances */}
      {lurkyBubbles.map(bubble => (
        <FloatingLurkyBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setLurkyBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all CoinGecko bubble instances */}
      {coinGeckoBubbles.map(bubble => (
        <FloatingCoinGeckoBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setCoinGeckoBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all CoinStats bubble instances */}
      {coinstatsBubbles.map(bubble => (
        <FloatingCoinStatsBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setCoinstatsBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all ICP bubble instances */}
      {icpBubbles.map(bubble => (
        <FloatingICPBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setIcpBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title || "ICP Status"}
          content={bubble.content}
          status={bubble.status || 'error'}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
      
      {/* Render all Hedera bubble instances */}
      {hederaBubbles.map(bubble => (
        <FloatingHederaBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setHederaBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
        />
      ))}
      
      {/* Render all ChangeNOW bubble instances */}
      {changeNowBubbles.map(bubble => (
        <FloatingChangeNowBubble
          key={bubble.id}
          isOpen={true}
          onClose={() => setChangeNowBubbles(prev => prev.filter(b => b.id !== bubble.id))}
          title={bubble.title}
          content={bubble.content}
          loading={bubble.loading}
          addParticlesToSwarm={addParticlesToSwarm}
        />
      ))}
    </div>
  )
}
