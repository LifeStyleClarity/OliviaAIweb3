import { useState, useEffect, useRef, useCallback } from 'react'
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
import InAppBrowser from '../components/ui/InAppBrowser.jsx';

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

  // Context awareness data for AI chat
  const [contextAwarenessData, setContextAwarenessData] = useState({
    market_data: {},
    sentiment_data: {},
    exchange_data: {},
    blockchain_data: {},
    last_updated: null
  })

  // In-app browser state
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browserUrl, setBrowserUrl] = useState('')

  // Handle opening URLs in in-app browser
  const handleUrlClick = useCallback((url) => {
    // Unescape any HTML entities that might have been escaped for onclick
    let cleanUrl = url.replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    
    // Fix common CoinGecko URL issues
    if (cleanUrl.includes('coingecko.com')) {
      // Remove /usd suffix if present (incorrect format)
      cleanUrl = cleanUrl.replace(/\/usd(\?|$)/, '$1')
      // Ensure proper format: /en/coins/token-name
      cleanUrl = cleanUrl.replace(/\/en\/coins\/([^/?]+).*/, '/en/coins/$1')
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://www.coingecko.com' + cleanUrl
      }
    }
    
    console.log('🔗 Opening URL in in-app browser:', cleanUrl)
    setBrowserUrl(cleanUrl)
    setBrowserOpen(true)
  }, [])

  // Handle closing in-app browser
  const handleCloseBrowser = useCallback(() => {
    setBrowserOpen(false)
    setBrowserUrl('')
  }, [])

  // Make handleUrlClick globally available for onclick handlers
  useEffect(() => {
    window.handleUrlClick = handleUrlClick
    return () => {
      delete window.handleUrlClick
    }
  }, [handleUrlClick])

  // Helper function to update context awareness data
  const updateContextAwareness = useCallback((category, token, data) => {
    setContextAwarenessData(prev => {
      const newData = {
        ...prev,
        [category]: {
          ...prev[category],
          [token]: {
            data: data,
            timestamp: new Date().toISOString()
          }
        },
        last_updated: new Date().toISOString()
      };
      // Make it globally available for WebSocket context
      window.contextAwarenessData = newData;
      return newData;
    })
  }, [])

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
              content: 'ICP Network\nDisconnected\n\nDev Mode:\nNo Local Replica',
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
    
    // Extract potential token names - be much more conservative
    const words = message.toLowerCase().match(/\b[a-zA-Z]{2,}\b/g) || [];
    
    // Known cryptocurrencies and common variations
    const knownCryptos = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
      'polygon', 'matic', 'dogecoin', 'doge', 'chainlink', 'link', 'litecoin', 'ltc',
      'polkadot', 'dot', 'avalanche', 'avax', 'cosmos', 'atom', 'uniswap', 'uni',
      'shiba', 'shib', 'pepe', 'bonk', 'popcat', 'wif', 'ton', 'usdt', 'usdc',
      'bnb', 'xrp', 'ripple', 'stellar', 'xlm', 'vechain', 'vet', 'tron', 'trx',
      'icp', 'hbar', 'hedera', 'near', 'algo', 'algorand', 'fil', 'filecoin'
    ];
    
    // Only consider words that are actually known cryptocurrencies
    const potentialTokens = words.filter(word => 
      knownCryptos.includes(word)
    );
    
    // Use the first known crypto token found
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

    // Handle Lurky bubble logic (coin mentions) - only one at a time
    if (mentionedCoin) {
      // Only create Lurky bubble if none exists
      if (lurkyBubbles.length === 0) {
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
          
          // Clean Lurky API response processing
          
          let lurkyText = '';
          
          // Always show what coin the user asked about
          const searchedCoin = mentionedCoin.charAt(0).toUpperCase() + mentionedCoin.slice(1);
          
          if (!data || typeof data !== 'object') {
            lurkyText = `${searchedCoin} Social Data\n\nNo data available from Lurky API\n\nTry asking about popular coins like:\n• Bitcoin\n• Ethereum\n• Solana`;
          } else if (data.message) {
            // Handle API errors/messages
            lurkyText = `${searchedCoin} Social Data\n\n${data.message}\n\n${data.suggestion || 'Try a different coin name'}`;
          } else if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
            // Find the coin that matches what user asked for - be more flexible
            const searchTerm = mentionedCoin.toLowerCase();
            let targetCoin = data.coins.find(coin => {
              const name = coin.name?.toLowerCase() || '';
              const symbol = coin.symbol?.toLowerCase() || '';
              
              // Check exact matches first
              if (symbol === searchTerm || name === searchTerm) return true;
              
              // Check if search term is contained in name
              if (name.includes(searchTerm)) return true;
              
              // Check common variations
              const variations = {
                'solana': ['sol', 'solana'],
                'bitcoin': ['btc', 'bitcoin'],
                'ethereum': ['eth', 'ethereum'],
                'cardano': ['ada', 'cardano'],
                'polygon': ['matic', 'polygon'],
                'dogecoin': ['doge', 'dogecoin'],
                'chainlink': ['link', 'chainlink']
              };
              
              const searchVariations = variations[searchTerm] || [searchTerm];
              return searchVariations.some(variant => 
                symbol === variant || name.includes(variant)
              );
            });
            
            // If still not found, just use the requested coin name anyway
            if (!targetCoin && data.coins.length > 0) {
              // Don't default to first coin, show that we're looking for the specific coin
              lurkyText = `${searchedCoin} Social Data\n\n`;
              lurkyText += `${searchedCoin} not found in current trending data\n\n`;
              lurkyText += `Available coins:\n`;
              data.coins.slice(0, 3).forEach(coin => {
                lurkyText += `• ${coin.name || coin.symbol}\n`;
              });
              lurkyText += `\nTry asking about trending coins`;
            } else {
              lurkyText = `${targetCoin.name || targetCoin.symbol || searchedCoin} Social Data\n\n`;
            }
            
            // Extract and display only mentions/sentiment data
            if (targetCoin.mentions) {
              const mentions = targetCoin.mentions;
              lurkyText += `Sentiment Analysis\n\n`;
              lurkyText += `Bullish: ${mentions.bullish || 0}\n`;
              lurkyText += `Bearish: ${mentions.bearish || 0}\n`;
              lurkyText += `Neutral: ${mentions.neutral || 0}\n`;
              lurkyText += `Total Mentions: ${mentions.total || 0}\n\n`;
              lurkyText += `Overall: ${mentions.overall_sentiment || 'Unknown'}`;
            } else {
              lurkyText += `No sentiment data available`;
            }
            
            lurkyText += `\n\nPowered by Lurky`;
            
            // Update context awareness with sentiment data
            updateContextAwareness('sentiment_data', mentionedCoin.toLowerCase(), {
              source: 'Lurky',
              name: targetCoin.name || mentionedCoin,
              symbol: targetCoin.symbol || mentionedCoin.toUpperCase(),
              mentions: targetCoin.mentions || null
            })
            
          } else {
            // Fallback - show general message
            lurkyText = `${searchedCoin} Social Data\n\n`;
            lurkyText += `No sentiment data available for ${searchedCoin}\n\n`;
            lurkyText += `Try popular coins like:\n• Bitcoin\n• Ethereum\n• Solana`;
          }
          
          // Update the specific bubble
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: lurkyText, loading: false }
              : bubble
          ))
        } catch (e) {
          console.error('[Lurky] Error:', e);
          const searchedCoin = mentionedCoin.charAt(0).toUpperCase() + mentionedCoin.slice(1);
          
          let errorContent = `${searchedCoin} Social Data\n\n`;
          
          if (e.response?.status === 429) {
            errorContent += `Rate limit exceeded\n\nToo many requests to Lurky API\nTry again in a few minutes`;
          } else if (e.response?.status === 401) {
            errorContent += `API key expired\n\nLurky API authentication failed\nContact support for a new key`;
          } else if (e.response?.status === 404) {
            errorContent += `Endpoint not found\n\nLurky API endpoint may have changed\nTry again later`;
          } else if (e.code === 'NETWORK_ERROR' || e.message?.includes('fetch')) {
            errorContent += `Network error\n\nCannot reach Lurky API\nCheck internet connection`;
          } else {
            errorContent += `Service unavailable\n\nLurky API is currently down\nTry again later\n\nError: ${e.message || 'Unknown error'}`;
          }
          
          // Update the specific bubble with error
          setLurkyBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: errorContent, loading: false }
              : bubble
          ))
        }
      })()
      }
    }
    // Keep Lurky bubble visible - building conversation bubble map

    // Handle CoinGecko bubble logic (price mentions + specific coin)
    if (mentionsPrice && mentionedCoin) {
      // Create new CoinGecko bubble instance for specific coin
      const coinName = mentionedCoin.charAt(0).toUpperCase() + mentionedCoin.slice(1);
      const newBubble = {
        id: Date.now() + Math.random(), // Unique ID
        title: `${coinName} Market Data - CoinGecko`,
        content: `Loading ${coinName} market data...`,
        loading: true
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // Get detailed coin data for the specific coin
          const data = await coingeckoService.getCoinDetails(mentionedCoin.toLowerCase())
          
          let marketText = `${data.name} (${data.symbol.toUpperCase()}) Market Stats\n\n`
          
          const marketData = data.market_data
          if (marketData) {
            // Price and 24h change
            const price = marketData.current_price?.usd || 0
            const change24h = marketData.price_change_percentage_24h || 0
            const changeDirection = change24h > 0 ? '+' : ''
            
            marketText += `Price: $${price.toLocaleString()}\n`
            marketText += `24h Change: ${changeDirection}${change24h.toFixed(2)}%\n\n`
            
            // Market stats
            const marketCap = marketData.market_cap?.usd
            const volume = marketData.total_volume?.usd
            const circulatingSupply = marketData.circulating_supply
            const maxSupply = marketData.max_supply
            
            if (marketCap) {
              marketText += `Market Cap: $${(marketCap/1e9).toFixed(2)}B\n`
            }
            if (volume) {
              marketText += `24h Volume: $${(volume/1e9).toFixed(2)}B\n`
            }
            if (circulatingSupply) {
              marketText += `Circulating: ${(circulatingSupply/1e6).toFixed(1)}M\n`
            }
            if (maxSupply) {
              marketText += `Max Supply: ${(maxSupply/1e6).toFixed(1)}M\n`
            } else {
              marketText += `Max Supply: Unlimited\n`
            }
            
            // Market rank
            if (data.market_cap_rank) {
              marketText += `\nRank: #${data.market_cap_rank}`
            }
          } else {
            marketText += 'Market data not available'
          }
          
          // Update context awareness with market data
          updateContextAwareness('market_data', mentionedCoin.toLowerCase(), {
            source: 'CoinGecko',
            name: data.name,
            symbol: data.symbol.toUpperCase(),
            price: marketData?.current_price?.usd,
            change_24h: marketData?.price_change_percentage_24h,
            market_cap: marketData?.market_cap?.usd,
            volume_24h: marketData?.total_volume?.usd,
            circulating_supply: marketData?.circulating_supply,
            max_supply: marketData?.max_supply,
            rank: data.market_cap_rank
          })

          // Update the specific bubble
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: marketText, loading: false }
              : bubble
          ))
        } catch (e) {
          console.error('CoinGecko detailed data error:', e)
          // Update the specific bubble with error
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: `${coinName} not found on CoinGecko\n\nTry:\n• "bitcoin price"\n• "ethereum market cap"\n• "solana volume"`, loading: false }
              : bubble
          ))
        }
      })()
    } else if (mentionsPrice) {
      // Fallback: show general market overview if no specific coin mentioned
      const newBubble = {
        id: Date.now() + Math.random(),
        title: 'Market Overview - CoinGecko', 
        content: 'Loading market overview...',
        loading: true
      }
      
      setCoinGeckoBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          const data = await coingeckoService.getPrices(['bitcoin', 'ethereum', 'solana'])
          let priceText = 'Top 3 Cryptos:\n\n'
          Object.entries(data).forEach(([coin, info]) => {
            const change = info.usd_24h_change || 0
            const changeDirection = change > 0 ? '+' : ''
            const price = info.usd > 1000 ? `${(info.usd/1000).toFixed(0)}k` : 
                         info.usd > 1 ? info.usd.toFixed(0) : 
                         info.usd.toFixed(3)
            const symbol = coin === 'bitcoin' ? 'BTC' : 
                          coin === 'ethereum' ? 'ETH' : 
                          coin === 'solana' ? 'SOL' : coin.slice(0,3).toUpperCase()
            priceText += `${symbol}: $${price} (${changeDirection}${change.toFixed(1)}%)\n`
          })
          priceText += '\nAsk about specific coins for detailed stats!'
          
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: priceText, loading: false }
              : bubble
          ))
        } catch (e) {
          setCoinGeckoBubbles(prev => prev.map(bubble => 
            bubble.id === newBubble.id 
              ? { ...bubble, content: 'Failed to fetch market overview from CoinGecko.', loading: false }
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
      
      // Use the same conservative token list as above
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
                const changeDirection = change > 0 ? '+' : '';
                const price = coin.price > 1000 ? `${(coin.price/1000).toFixed(2)}k` : coin.price.toFixed(4);
                const marketCap = coin.marketCap ? `$${(coin.marketCap/1e9).toFixed(2)}B` : 'N/A';
                const volume = coin.volume ? `$${(coin.volume/1e6).toFixed(1)}M` : 'N/A';
                
                tokenText = `${coin.name} (${coin.symbol})\n\n`;
                tokenText += `Price: $${price}\n`;
                tokenText += `24h: ${changeDirection}${change.toFixed(2)}%\n`;
                tokenText += `Market Cap: ${marketCap}\n`;
                tokenText += `Volume: ${volume}\n`;
                tokenText += `Rank: #${coin.rank || 'N/A'}`;
                
                // Update context awareness with CoinStats data
                updateContextAwareness('market_data', detectedToken.toLowerCase(), {
                  source: 'CoinStats',
                  name: coin.name,
                  symbol: coin.symbol,
                  price: coin.price,
                  change_24h: coin.priceChange1d,
                  market_cap: coin.marketCap,
                  volume_24h: coin.volume,
                  rank: coin.rank
                })
              } else {
                tokenText = `Token "${detectedToken.toUpperCase()}" not found\n\nTry searching for:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Solana (SOL)\n• Popular tokens`;
              }
            } catch (searchError) {
              console.error('Token search failed:', searchError);
              tokenText = `"${detectedToken.toUpperCase()}" not found\n\nDouble-check the token name or try:\n• Bitcoin → "bitcoin price"\n• Ethereum → "eth price"\n• Solana → "solana price"`;
            }
          } else {
            // No specific token detected
            tokenText = `No specific token detected\n\nPlease specify a token:\n• "bitcoin price"\n• "ethereum price" \n• "solana price"\n• "cardano price"`;
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
              ? { ...bubble, content: `CoinStats API Error\n\nTry asking for:\n• "bitcoin price"\n• "ethereum coin"\n• "solana price"`, loading: false }
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
            const changeDirection = change > 0 ? '+' : ''
            const marketCap = data.price.usd_market_cap || 0
            
            hederaText += `HBAR $${price.toFixed(4)}\n`
            hederaText += `24h: ${change.toFixed(2)}%\n`
            hederaText += `Cap: $${(marketCap / 1e9).toFixed(2)}B\n\n`
          }
          
          // Format network data
          if (data.network) {
            hederaText += `Network Status\n`
            hederaText += `Total Supply: ${(data.network.total_supply / 1e8).toFixed(0)}B HBAR\n`
          }
          
          // Format recent transactions
          if (data.transactions && data.transactions.transactions) {
            hederaText += `\nRecent Activity\n`
            hederaText += `Latest TXs: ${data.transactions.transactions.length}\n`
          }
          
          if (!hederaText) {
            hederaText = 'Hedera network data loaded successfully!'
          }
          
          // Update context awareness with Hedera blockchain data
          updateContextAwareness('blockchain_data', 'hedera', {
            source: 'Hgraph',
            token: 'HBAR',
            price: data.price?.usd,
            change_24h: data.price?.usd_24h_change,
            market_cap: data.price?.usd_market_cap,
            total_supply: data.network?.total_supply,
            recent_transactions: data.transactions?.transactions?.length,
            network_status: 'active'
          })
          
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
            
            exchangeText = `Buy ${toToken.name} (${toToken.ticker.toUpperCase()}) with USDT\n\n`;
            
            // Minimum exchange amount
            if (exchangeInfo.minAmount) {
              exchangeText += `Minimum: ${exchangeInfo.minAmount.minAmount} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange range (limits)
            if (exchangeInfo.exchangeRange) {
              const range = exchangeInfo.exchangeRange;
              exchangeText += `Limits: ${range.minAmount || 'N/A'} - ${range.maxAmount || 'Unlimited'} ${fromToken.ticker.toUpperCase()}\n`;
            }
            
            // Exchange rate and fees
            if (exchangeInfo.exchangeAmount) {
              const rate = exchangeInfo.exchangeAmount;
              exchangeText += `Rate: 1 ${fromToken.ticker.toUpperCase()} = ${rate.estimatedAmount} ${toToken.ticker.toUpperCase()}\n`;
            }
            
            // Market info (fees and processing time)
            if (exchangeInfo.marketInfo) {
              const market = exchangeInfo.marketInfo;
              if (market.fee !== undefined) {
                exchangeText += `Fee: ${(market.fee * 100).toFixed(2)}%\n`;
              }
              if (market.flow) {
                exchangeText += `Flow: ${market.flow}\n`;
              }
            }
            
            exchangeText += `\nProcessing: ~5-30 minutes\n`;
            exchangeText += `Cross-chain swaps available\n\n`;
            // For "buy [token]" - user wants to buy the token with USDT (USDT -> Token)
            exchangeText += `Ready to swap?\nVisit: https://changenow.io\nSwap: ${fromToken.ticker.toUpperCase()} → ${toToken.ticker.toUpperCase()}`;
            
            // Update context awareness with exchange data
            updateContextAwareness('exchange_data', mentionedCoin.toLowerCase(), {
              source: 'ChangeNOW',
              from_currency: fromToken.ticker.toUpperCase(),
              to_currency: toToken.ticker.toUpperCase(),
              min_amount: exchangeInfo.minAmount?.minAmount,
              max_amount: exchangeInfo.exchangeRange?.maxAmount,
              exchange_rate: exchangeInfo.exchangeAmount?.estimatedAmount,
              fee_percentage: exchangeInfo.marketInfo?.fee ? (exchangeInfo.marketInfo.fee * 100).toFixed(2) : null,
              processing_time: '5-30 minutes',
              available: true
            })
            
          } else {
            exchangeText = `"${mentionedCoin.toUpperCase()}" not available for exchange\n\nTry popular tokens like:\n• Bitcoin (BTC)\n• Ethereum (ETH)\n• Solana (SOL)\n• Cardano (ADA)`;
            
            // Update context awareness even for unavailable tokens
            updateContextAwareness('exchange_data', mentionedCoin.toLowerCase(), {
              source: 'ChangeNOW',
              available: false,
              reason: 'Token not supported'
            })
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
              ? { ...bubble, content: `ChangeNOW API Error\n\nCouldn't fetch exchange data for ${mentionedCoin.toUpperCase()}\n\nTry asking for:\n• "buy bitcoin"\n• "swap ethereum"\n• "trade solana"`, loading: false }
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
          console.log('Home.jsx: Starting thinking indicator and message send process...');
          setIsLoading(true) // Show thinking indicator after greeting
          
          console.log('Home.jsx: WebSocket status:', { isConnected });
          
          // Always try to connect (it's safe to call multiple times)
          console.log('Home.jsx: Ensuring WebSocket connection...');
          await connect();
          console.log('Home.jsx: Connect function called');
          
          // Wait briefly for the connection event to trigger
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('📤 Home.jsx: Attempting to send message directly...');
          
          try {
            const result = await sendMessage('hey who are you and what day is it');
            console.log('📨 Home.jsx: Send message result:', result);
            
            if (!result) {
              console.error('Home.jsx: Send message returned false, stopping loading');
              setIsLoading(false);
            }
          } catch (error) {
            console.error('Home.jsx: Error sending message:', error);
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
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        // Convert markdown links [text](url) to HTML links with in-app browser
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                          const cleanUrl = url.trim().replace(/[.,;!?]*$/, ''); // Remove trailing punctuation
                          const escapedUrl = cleanUrl.replace(/'/g, '&#39;').replace(/"/g, '&quot;'); // Escape quotes properly
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `<a id="${uniqueId}" href="#" onclick="window.handleUrlClick && window.handleUrlClick('${escapedUrl}'); return false;" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${text}</a>`;
                        })
                        // Convert plain URLs with protocol to clickable links
                        .replace(/(^|[\s>])(https?:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=])*[a-zA-Z0-9\-_~/#@$*+=])/g, (match, prefix, url) => {
                          // Clean up URL - remove trailing punctuation that's likely sentence punctuation
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          const escapedUrl = cleanUrl.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" onclick="window.handleUrlClick && window.handleUrlClick('${escapedUrl}'); return false;" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        })
                        // Convert URLs without protocol (www.example.com, domain.com) to clickable links
                        .replace(/(^|[\s>])((?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9\-._]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?)/g, (match, prefix, url) => {
                          // Skip if it's already part of a protocol URL or already a link
                          if (match.includes('://') || match.includes('<a')) return match;
                          
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          // Add https:// if no protocol
                          const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : 'https://' + cleanUrl;
                          const escapedUrl = fullUrl.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" onclick="window.handleUrlClick && window.handleUrlClick('${escapedUrl}'); return false;" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        })
                    }}
                  >
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
      
      {/* In-App Browser */}
      <InAppBrowser
        isOpen={browserOpen}
        url={browserUrl}
        onClose={handleCloseBrowser}
      />
    </div>
  )
}
