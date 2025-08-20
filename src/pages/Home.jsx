import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useInternetIdentity } from '../contexts/InternetIdentityContext'
import { useAccountUpgrade } from '../hooks/useAccountUpgrade';
import { icpService } from '../api/services/icp.service.js';
import { lurkyService, coingeckoService, coinstatsService, hgraphService, changeNowService } from '../api';
import { log, error as logError } from '../utils/logger.js';
import FloatingLurkyBubble from '../components/ui/FloatingLurkyBubble.jsx';
import FloatingCoinGeckoBubble from '../components/ui/FloatingCoinGeckoBubble.jsx';
import FloatingCoinStatsBubble from '../components/ui/FloatingCoinStatsBubble.jsx';
import FloatingICPBubble from '../components/ui/FloatingICPBubble.jsx';
import FloatingHederaBubble from '../components/ui/FloatingHederaBubble.jsx';
import FloatingChangeNowBubble from '../components/ui/FloatingChangeNowBubble.jsx';
import InAppBrowser from '../components/ui/InAppBrowser.jsx';

export default function Home() {
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

  // Debug browser state changes
  useEffect(() => {
    log('🔗 Browser state changed:', { browserOpen, browserUrl })
  }, [browserOpen, browserUrl])

  // Handle opening URLs in in-app browser
  const handleUrlClick = useCallback((url) => {
    // Unescape any HTML entities that might have been escaped for onclick
    let cleanUrl = url.replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    
    log('🔗 URL click triggered with:', url)
    log('🔗 Cleaned URL:', cleanUrl)
    
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
    
    log('🔗 Final URL for browser:', cleanUrl)
    log('🔗 Setting browserOpen to true')
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

  // Add event delegation for URL clicks to handle dangerouslySetInnerHTML links
  useEffect(() => {
    const handleDocumentClick = (event) => {
      // Check if clicked element is one of our generated links
      if (event.target.tagName === 'A' && event.target.id?.startsWith('link_')) {
        event.preventDefault();
        const href = event.target.getAttribute('data-url');
        if (href && handleUrlClick) {
          log('🔗 Link clicked via event delegation:', href);
          handleUrlClick(href);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
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
  const { isConnected, sendMessage, subscribe, connect, isConnecting, connectionAttempts, currentEndpointIndex, wsEndpoints } = useWebSocket()
  const { principal, isAuthenticated } = useInternetIdentity()
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

  // Parse AI responses for coin mentions and show bubbles - DYNAMIC EXTRACTION
  const parseAIResponseForCoins = useCallback(async (aiMessage) => {
    log('🤖 AI Agent: Extracting potential tokens from:', aiMessage)
    
    // SMART TOKEN EXTRACTION - No hardcoded lists!
    const extractPotentialTokens = (text) => {
      const candidates = new Set();
      
      // Pattern 1: Capitalized words (likely token names) - HYPE, ONDO, FLOKI
      const capitalizedWords = text.match(/\b[A-Z][A-Z]+\b/g) || [];
      capitalizedWords.forEach(word => {
        if (word.length >= 3 && word.length <= 8) { // reasonable token length
          candidates.add(word.toLowerCase());
        }
      });
      
      // Pattern 2: Common token patterns with parentheses - Bitcoin (BTC), Solana (SOL)
      const parenthesesTokens = text.match(/\(([A-Z]{2,6})\)/g) || [];
      parenthesesTokens.forEach(match => {
        const token = match.replace(/[()]/g, '');
        candidates.add(token.toLowerCase());
      });
      
      // Pattern 3: Words ending in typical token suffixes
      const tokenSuffixWords = text.match(/\b\w*(?:coin|token|protocol|network|finance|liquid|inu)\b/gi) || [];
      tokenSuffixWords.forEach(word => {
        if (word.length >= 4 && word.length <= 15) {
          candidates.add(word.toLowerCase());
        }
      });
      
      // Pattern 4: Compound token names - "Ocean Protocol", "Pudgy Penguins"
      const compoundTokens = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
      compoundTokens.forEach(compound => {
        // Try both the compound and individual words
        candidates.add(compound.toLowerCase().replace(/\s+/g, ''));
        const words = compound.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length >= 3) candidates.add(word);
        });
      });
      
      // Pattern 5: Well-known major tokens (minimal hardcoded list for common ones)
      const majorTokens = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polygon', 'avalanche', 'chainlink'];
      const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      words.forEach(word => {
        if (majorTokens.includes(word)) {
          candidates.add(word);
        }
      });
      
      return Array.from(candidates);
    };
    
    // Extract all potential token candidates
    const potentialTokens = extractPotentialTokens(aiMessage);
    log('🔍 AI Agent found potential tokens:', potentialTokens);
    
    // DYNAMIC API VALIDATION - Test each candidate against CoinStats API
    const validatedTokens = [];
    const maxTokensToTest = 6; // Limit to avoid spam
    const tokensToTest = potentialTokens.slice(0, maxTokensToTest);
    
    log('🧪 AI Agent: Testing tokens against CoinStats API...', tokensToTest);
    
    // Test each potential token in parallel
    const validationPromises = tokensToTest.map(async (token) => {
      try {
        log(`🔎 Testing token: ${token}`);
        const searchData = await coinstatsService.searchCoins(token);
        
        if (searchData.result && searchData.result.length > 0) {
          const coinData = searchData.result[0]; // Get best match
          log(`✅ Found valid token: ${token} -> ${coinData.name} (${coinData.symbol})`);
          return {
            searchTerm: token,
            coinData: coinData,
            isValid: true
          };
        } else {
          log(`❌ Token not found in CoinStats: ${token}`);
          return { searchTerm: token, isValid: false };
        }
      } catch (error) {
        log(`⚠️ API error testing token ${token}:`, error);
        return { searchTerm: token, isValid: false };
      }
    });
    
    // Wait for all validations to complete
    const validationResults = await Promise.all(validationPromises);
    const validTokens = validationResults.filter(result => result.isValid);
    
    log('🎯 AI Agent: Valid tokens found:', validTokens.map(t => `${t.searchTerm} -> ${t.coinData?.name}`));
    
    // Process each validated token (limit to first 4 to avoid spam)
    const tokensToProcess = validTokens.slice(0, 4);
    
    for (const tokenResult of tokensToProcess) {
      const { searchTerm, coinData } = tokenResult;
      log(`🚀 Creating bubble for validated token: ${searchTerm} -> ${coinData.name}`);
      
      // Create CoinStats bubble for this validated token
      const coinName = coinData.name;
      const coinStatsBubble = {
        id: Date.now() + Math.random() + Math.random(), // Extra unique ID
        title: `${coinName} (Olivia thought) - CoinStats`,
        content: `Loading ${coinName} live data from Olivia's suggestion...`,
        loading: true
      };
      
      setCoinstatsBubbles(prev => [...prev, coinStatsBubble]);
      
      // We already have the coin data from validation, so format it for display
      const change = coinData.priceChange1d || 0;
      const changeDirection = change > 0 ? '+' : '';
      const price = coinData.price > 1000 ? `${(coinData.price/1000).toFixed(2)}k` : 
                   coinData.price > 1 ? coinData.price.toFixed(2) : 
                   coinData.price > 0.01 ? coinData.price.toFixed(4) :
                   coinData.price.toFixed(8);
      const marketCap = coinData.marketCap ? `$${(coinData.marketCap/1e9).toFixed(2)}B` : 'N/A';
      const volume = coinData.volume ? `$${(coinData.volume/1e6).toFixed(1)}M` : 'N/A';
      
      let marketText = `${coinData.name} (${coinData.symbol}) - Olivia thought\n\n`;
      marketText += `Price: $${price}\n`;
      marketText += `24h: ${changeDirection}${change.toFixed(2)}%\n`;
      marketText += `Market Cap: ${marketCap}\n`;
      marketText += `Volume: ${volume}\n`;
      marketText += `Rank: #${coinData.rank || 'N/A'}\n\n`;
      marketText += `Successfully loaded`;
      
      // Update context awareness with CoinStats data
      updateContextAwareness('market_data', searchTerm.toLowerCase(), {
        source: 'CoinStats (Olivia thought)',
        name: coinData.name,
        symbol: coinData.symbol,
        price: coinData.price,
        change_24h: coinData.priceChange1d,
        market_cap: coinData.marketCap,
        volume_24h: coinData.volume,
        rank: coinData.rank,
        mentioned_by_olivia: true,
        discovered_by_ai: true
      });
      
      // Update the bubble with live data
      setCoinstatsBubbles(prev => prev.map(bubble => 
        bubble.id === coinStatsBubble.id 
          ? { ...bubble, content: marketText, loading: false }
          : bubble
      ));
      
      // Small delay between token lookups to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }, [updateContextAwareness]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (data) => {
      log('📨 Received message:', data)
      
      if (data.type === 'stream_chunk') {
        setCurrentResponse(prev => prev + (data.data?.text || data.content || ''))
        setIsLoading(false)
      } else if (data.type === 'stream_complete') {
        const finalResponse = data.data?.fullResponse || data.data?.text || currentResponse
        setMessages(prev => [...prev, { type: 'ai', content: finalResponse }])
        setCurrentResponse('')
        setIsLoading(false)
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(finalResponse);
        
        // Show input after response is complete
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'response') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(response);
        
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      } else if (data.type === 'text') {
        const response = data.data?.text || data.content || data.message || ''
        setMessages(prev => [...prev, { type: 'ai', content: response }])
        setCurrentResponse('')
        setIsLoading(false)
        
        // Parse AI response for coin mentions
        parseAIResponseForCoins(response);
        
        // Show input after response
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      }
    }

    const unsubscribe = subscribe(handleMessage)
    return () => unsubscribe()
  }, [subscribe, currentResponse, parseAIResponseForCoins])

  // Focus input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  // Create ICP Status bubble on startup and monitor ICP connection
  useEffect(() => {
    // Create initial ICP status bubble showing current state
    const createICPStatusBubble = async () => {
      // Test backend connectivity using the existing ICP service method
      let isBackendReachable = false;
      try {
        const connectionTest = await icpService.testConnection();
        isBackendReachable = connectionTest.success;
        log('🟦 ICP Backend connectivity test:', connectionTest);
      } catch (error) {
        log('🟦 ICP Backend connectivity test failed:', error);
        isBackendReachable = false;
      }
      
      setIcpBubbles(prev => {
        if (prev.length === 0) {
          // Show connected if backend is reachable OR user is authenticated
          const isICPWorking = isBackendReachable || !!principal || isAuthenticated;
          
          let content, status;
          if (isICPWorking) {
            content = `ICP Network\nConnected\n\nBackend: ${isBackendReachable ? 'Active' : 'Offline'}\nAuth: ${isAuthenticated ? 'Authenticated' : 'Available'}\nPrincipal: ${principal ? principal.slice(0, 8) + '...' : 'None'}`;
            status = 'success';
          } else {
            content = `ICP Network\nConnecting...\n\nBackend: Starting\nAuth: Initializing\nStatus: Loading`;
            status = 'connecting';
          }
          
          const newIcpBubble = {
            id: Date.now() + Math.random(),
            title: 'ICP Status',
            content: content,
            status: status,
            loading: false
          }
          return [newIcpBubble];
        }
        return prev;
      });
    };

    // Create bubble after a short delay to let auth initialize
    const timer = setTimeout(createICPStatusBubble, 1000);

    // Monitor console for ICP logErrors and update bubble
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
              // Check for ICP-related errors
      if (message.includes('ICP network not available') || 
          message.includes('ICP Service:') ||
          message.includes('net::ERR_CONNECTION_REFUSED') && message.includes('4943')) {
        
        // Update existing ICP bubble or create error bubble
        setIcpBubbles(prev => {
          if (prev.length > 0) {
            // Update existing bubble with error
            return prev.map(bubble => ({
              ...bubble,
              content: 'ICP Network\nError\n\nDev Mode:\nReplica Offline\nCheck dfx status',
              status: 'error'
            }));
          } else {
            // Create new error bubble
            const newIcpBubble = {
              id: Date.now() + Math.random(),
              title: 'ICP Status',
              content: 'ICP Network\nDisconnected\n\nDev Mode:\nNo Local Replica',
              status: 'error',
              loading: false
            }
            return [newIcpBubble];
          }
        });
      }
      
      // Call original error
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      clearTimeout(timer);
      console.error = originalConsoleError;
    };
  }, [principal, isAuthenticated])

  // Update ICP bubble when authentication status changes
  useEffect(() => {
    if (icpBubbles.length > 0) {
      // Test backend connectivity on auth changes
      const updateBubbleStatus = async () => {
        let isBackendReachable = false;
        try {
          const connectionTest = await icpService.testConnection();
          isBackendReachable = connectionTest.success;
        } catch (error) {
          log('🟦 ICP Backend connectivity update test failed:', error);
          isBackendReachable = false;
        }
        
        setIcpBubbles(prev => prev.map(bubble => {
          const isICPWorking = isBackendReachable || !!principal || isAuthenticated;
          
          let content, status;
          if (isICPWorking) {
            content = `ICP Network\nConnected\n\nBackend: ${isBackendReachable ? 'Active' : 'Offline'}\nAuth: ${isAuthenticated ? 'Authenticated' : 'Available'}\nPrincipal: ${principal ? principal.slice(0, 8) + '...' : 'None'}`;
            status = 'success';
          } else {
            content = `ICP Network\nConnecting...\n\nBackend: Starting\nAuth: Initializing\nStatus: Loading`;
            status = 'connecting';
          }
          
          return {
            ...bubble,
            content: content,
            status: status
          };
        }));
      };
      
      updateBubbleStatus();
    }
  }, [principal, isAuthenticated, icpBubbles.length])

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
      'icp', 'hbar', 'hedera', 'near', 'algo', 'algorand', 'fil', 'filecoin',
      'omikami', 'rize', 'sui', 'apt', 'aptos', 'injective', 'inj', 'render', 'rndr',
      'theta', 'mana', 'decentraland', 'sand', 'sandbox', 'axs', 'axie',
      'cfx', 'conflux', 'pudgy', 'penguins', 'ethena', 'curve', 'dao', 'crv'
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
            // Handle API logErrors/messages
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
          // Update the bubble with logError content
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
        loading: true,
        originalQuery: message // Store the original user message for OpenAI extraction
      }
      
      setChangeNowBubbles(prev => [...prev, newBubble])
      ;(async () => {
        try {
          // For "buy [token]" - user wants to buy the token with USD (USD -> Token)
          // Use 'usd' for fiat purchases instead of 'usdt' for crypto-to-crypto
          const sourceToken = message.toLowerCase().includes('buy') ? 'usd' : 'usdt';
          const exchangeInfo = await changeNowService.getExchangeInfo(sourceToken, mentionedCoin, 1);
          
          let exchangeText = '';
          
          if (exchangeInfo.fromCurrency && exchangeInfo.toCurrency) {
            const fromToken = exchangeInfo.fromCurrency;
            const toToken = exchangeInfo.toCurrency;
            
            const sourceDisplayName = sourceToken.toUpperCase() === 'USD' ? 'USD' : 'USDT';
            exchangeText = `Buy ${toToken.name} (${toToken.ticker.toUpperCase()}) with ${sourceDisplayName}\n\n`;
            
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
            // Normalize token symbols for URL generation
            const normalizeTokenSymbol = (symbol) => {
              const normalized = symbol.toLowerCase();
              // Handle common ChangeNOW API symbol variations
              if (normalized.includes('usd') && !normalized.includes('usdt')) return 'USD';
              if (normalized === 'usdt' || normalized.includes('usdt')) return 'USDT';
              if (normalized === 'ton' || normalized.includes('ton')) return 'TON';
              return symbol.toUpperCase();
            };
            
            const fromSymbol = normalizeTokenSymbol(fromToken.ticker);
            const toSymbol = normalizeTokenSymbol(toToken.ticker);
            
            // For "buy [token]" operations, show the appropriate source
            const userIntent = message.toLowerCase().includes('buy') ? `Buy ${toSymbol}` : 
                              message.toLowerCase().includes('sell') ? `Sell ${fromSymbol}` :
                              message.toLowerCase().includes('trade') ? `Trade ${fromSymbol} for ${toSymbol}` :
                              `Swap ${fromSymbol} to ${toSymbol}`;
            
            exchangeText += `Ready to ${userIntent.toLowerCase()}?\nVisit: https://changenow.io\nSwap: ${fromSymbol} → ${toSymbol}`;
            
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

    // Send message to Olivia - new waitForConnection() logic handles everything
    try {
      log('📤 Sending message to Olivia AI...')
      const result = await sendMessage(message)
      
      if (!result) {
        // sendMessage returned false - connection failed after waiting
        setMessages(prev => [...prev, { 
          type: 'ai', 
          content: 'Sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment. In the meantime, you can still see cryptocurrency data above!' 
        }])
        setIsLoading(false)
        setShowInput(true)
      }
      // If successful, the WebSocket message handler will take care of the response
      
    } catch (error) {
      logError('Failed to send message:', error)
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: 'I\'m currently offline, but you can still get crypto data from the bubbles above! Try asking about Bitcoin, Ethereum, or other coins.' 
      }])
      setIsLoading(false)
      setShowInput(true)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Auto-initialize the chat on component mount
  useEffect(() => {
    log('🚀 Home.jsx: Auto-initializing chat on mount');
    setIsLoading(false) // Don't show loading initially
    setMessages([{
      type: 'ai',
      content: "Hey there, welcome to Olivia AI! Ask me about cryptocurrencies, trading, or anything Web3!"
    }]) // Show instant greeting
    setCurrentResponse('')
    setShowInput(true) // Show input immediately
    setUserInput('')
  }, [])



  return (
    <div className="flex flex-col gap-6 relative h-full w-full overflow-hidden bg-black">
      
      {/* WebSocket Status Debug (bottom-right) - Development Only */}
      {import.meta.env.VITE_NODE === 'development' && (
        <div className={`fixed bottom-4 right-4 text-white p-2 text-xs z-50 rounded ${
          isConnected ? 'bg-green-600' : isConnecting ? 'bg-yellow-600' : 'bg-red-600'
        }`}>
          {isConnected ? '🟢 AI Connected' : 
           isConnecting ? `🟡 Connecting... (${connectionAttempts}/10)` : 
           `🔴 AI Offline`}
          {!isConnected && (
            <div className="text-[10px] mt-1">
              Endpoint: {currentEndpointIndex + 1}/{wsEndpoints?.length || 0}
              <button 
                onClick={connect}
                className="ml-2 px-1 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-[9px]"
                disabled={isConnecting}
              >
                Retry
              </button>
            </div>
          )}
        </div>
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

      {/* Conversation Display - Just Above Input */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10 pb-36" style={{marginBottom: '-120px'}}>
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
                      __html: (() => {
                        let content = msg.content;
                        
                        // First, convert markdown links [text](url) to HTML links
                        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                          const cleanUrl = url.trim().replace(/[.,;!?]*$/, '');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `<a id="${uniqueId}" href="#" data-url="${cleanUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${text}</a>`;
                        });
                        
                        // Create a temporary marker to avoid processing already converted links
                        const linkMarker = '___CONVERTED_LINK___';
                        content = content.replace(/<a[^>]*>.*?<\/a>/g, `${linkMarker}$&${linkMarker}`);
                        
                        // Convert URLs with protocol to clickable links (only if not already a link)
                        content = content.replace(/(^|[^>]|[\s])(https?:\/\/[^\s<>]+)/g, (match, prefix, url) => {
                          // Skip if we're inside a converted link
                          if (match.includes(linkMarker)) return match;
                          
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" data-url="${cleanUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        });
                        
                        // Convert URLs without protocol (www.example.com) to clickable links
                        content = content.replace(/(^|[\s])(www\.[a-zA-Z0-9][a-zA-Z0-9\-._]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s<>]*)?)/g, (match, prefix, url) => {
                          // Skip if we're inside a converted link
                          if (match.includes(linkMarker)) return match;
                          
                          const cleanUrl = url.replace(/[.,;!?]+$/, '');
                          const fullUrl = 'https://' + cleanUrl;
                          const uniqueId = 'link_' + Math.random().toString(36).substr(2, 9);
                          return `${prefix}<a id="${uniqueId}" href="#" data-url="${fullUrl}" style="color: #31F46E; text-decoration: underline; cursor: pointer;">${cleanUrl}</a>`;
                        });
                        
                        // Remove the link markers
                        content = content.replace(new RegExp(linkMarker, 'g'), '');
                        
                        return content;
                      })()
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
              <div className="fixed bottom-52 left-4 right-4 z-20">
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
          originalQuery={bubble.originalQuery} // Pass the original user query for OpenAI extraction
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
