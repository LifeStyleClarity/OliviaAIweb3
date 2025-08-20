import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import changeNowLogo from './change now .png';
import { log, error as logError } from '../../utils/logger.js';

// OpenAI Trading Parameter Extraction Service
const extractTradingParameters = async (input) => {
  try {
    const response = await fetch('http://localhost:3001/api/openai/extract-trading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data.extracted_parameters : null;
  } catch (error) {
    logError('🚨 Failed to extract trading parameters:', error);
    return null;
  }
};

const FloatingChangeNowBubble = ({ isOpen, onClose, title = 'ChangeNOW', content = '', loading = false, addParticlesToSwarm, originalQuery = '' }) => {
  const bubbleId = useState(() => `changenow-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Dynamic bubble size based on expanded state
        let bubbleSize = 140; // Base collapsed size
        if (isExpanded) {
          bubbleSize = 380; // Expanded size for content
        }
        const margin = 20;
        
        // Simple upward floating 
        let newY = prev.y - 2; // Faster upward movement (2x speed)
        let newX = prev.x;
        
        // Get all bubbles for collision detection
        const allBubbles = Array.from(document.querySelectorAll('[data-bubble]'));
        const otherBubbles = allBubbles.filter(b => b.getAttribute('data-bubble-id') !== bubbleId);
        
        // Collision detection and avoidance
        otherBubbles.forEach(otherBubble => {
          const otherRect = otherBubble.getBoundingClientRect();
          const otherCenterX = otherRect.left + otherRect.width / 2;
          const otherCenterY = otherRect.top + otherRect.height / 2;
          
          const currentCenterX = newX + bubbleSize / 2;
          const currentCenterY = newY + bubbleSize / 2;
          
          const dx = currentCenterX - otherCenterX;
          const dy = currentCenterY - otherCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const minDistance = bubbleSize + 20; // Minimum distance between bubbles
          
          if (distance < minDistance && distance > 0) {
            // Calculate push force based on overlap
            const overlap = minDistance - distance;
            const pushForce = overlap; // Stronger push
            
            // Normalize the direction vector
            const pushX = (dx / distance) * pushForce;
            const pushY = (dy / distance) * pushForce;
            
            // Apply the push (move away from other bubble)
            newX += pushX;
            newY += pushY;
          }
        });
        
        // SOLID BOUNDARIES - final enforcement (can't be pushed past)
        const maxX = window.innerWidth - bubbleSize - margin;
        const minX = margin;
        newX = Math.max(minX, Math.min(maxX, newX));
        
        // Keep within screen bounds but allow natural floating to top
        newY = Math.max(margin, newY);
        newY = Math.min(window.innerHeight - bubbleSize - margin, newY);
        
        return { x: newX, y: newY };
      });
    }, 50); // Animation interval

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded, bubbleId]);

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    // Dynamic bubble size based on expanded state
    let bubbleSize = 140; // Base collapsed size
    if (isExpanded) {
      bubbleSize = 380; // Expanded size for content
    }
    const bubbleCenter = {
      x: position.x + bubbleSize / 2, // Actual bubble center
      y: position.y + bubbleSize / 2  // Actual bubble center
    };

    const newParticles = [];
    for (let i = 0; i < 8; i++) { // Reduced from 25 to 8 particles
      const angle = (Math.PI * 2 * i) / 8;
      const speed = Math.random() * 8 + 3; // Faster initial speed
      const drift = (Math.random() - 0.5) * 0.5; // Random drift
      newParticles.push({
        id: Math.random(),
        x: bubbleCenter.x + (Math.random() - 0.5) * 20, // Slight random spread from center
        y: bubbleCenter.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + drift,
        vy: Math.sin(angle) * speed - Math.random() * 3, // More varied upward velocity
        size: Math.random() * 2 + 1.5, // Same as background particles: 1.5-3.5px
      });
    }
    
    // Add particles to main swarm
    addParticlesToSwarm(newParticles);
    
    // Close bubble after pop animation starts
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    // Don't handle if clicking on interactive elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button or interactive elements
    if (e.target.getAttribute('aria-label') === 'Close') return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    // Check for double-click to pop
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      createPopEffect();
      return;
    }
    setLastClickTime(currentTime);
    
    // Toggle expanded state
    setIsExpanded(prev => !prev);
  };

  useEffect(() => {
    if (!isDragging) return;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  // Dynamic bubble size based on expanded state
  let bubbleSize = 140; // Base collapsed size
  if (isExpanded) {
    bubbleSize = 380; // Expanded size for content
  }

  const bubble = (
    <div
      className="fixed select-none transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        width: bubbleSize,
        height: bubbleSize,
        zIndex: 2147483644, // Higher z-index
        cursor: isDragging ? 'grabbing' : 'grab',
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="changenow"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-orange-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #fb923c, inset 0 0 20px rgba(251, 146, 60, 0.15)'}}>
        {/* Enhanced neon orange glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-orange-300/60 animate-pulse" style={{boxShadow: '0 0 25px #fb923c, 0 0 50px rgba(251, 146, 60, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500/5 via-transparent to-orange-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-orange-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-400 shadow-lg shadow-orange-500/40 mb-2 bg-black/20">
                <img 
                  src={changeNowLogo} 
                  alt="ChangeNOW Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-orange-400">Loading...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex flex-col items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central ChangeNOW Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-orange-400 shadow-2xl shadow-orange-500/60 bg-gradient-to-br from-orange-400/30 to-orange-600/40 hover:border-orange-300 transition-all duration-300 hover:shadow-orange-400/80 hover:scale-105 group">
                      <img 
                        src={changeNowLogo} 
                        alt="ChangeNOW Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-orange-400/10 to-orange-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-orange-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-orange-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
              ) : (
                // Expanded: Spherical layout with enhanced content
                <div className="w-full h-full flex flex-col">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-orange-400 shadow-2xl shadow-orange-500/60 bg-gradient-to-br from-orange-400/30 to-orange-600/40 mx-auto mb-2">
                      <img 
                        src={changeNowLogo} 
                        alt="ChangeNOW Logo" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-orange-400/10 to-orange-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-orange-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Crypto Exchange</div>
                  </div>
                  
                  {/* Central content area - spherical text flow */}
                  <div className="flex-1 flex items-center justify-center mt-24 mb-4 max-w-full overflow-hidden">
                    <div className="text-center px-4">
                      {typeof content === 'string' ? (
                        <ReactMarkdown className="whitespace-pre-wrap font-medium text-xs text-white/90 leading-relaxed prose prose-invert max-w-none">
                          {content}
                        </ReactMarkdown>
                      ) : (
                        <div className="font-mono text-xs text-orange-300 bg-black/30 p-3 rounded-full border border-orange-400/30 max-w-full">
                          {JSON.stringify(content, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Enhanced Exchange button - bigger and more clickable */}
                  {(content.includes('changenow.io') || content.includes('buy') || content.includes('swap') || content.includes('sell') || content.includes('trade') || content.includes('exchange')) && (
                    <div className="mt-4 mb-2 flex justify-center">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          log('🔄 Exchange Now button clicked!');
                          log('📋 Content:', content);
                          log('🏷️ Title:', title);
                          log('📝 Original Query:', originalQuery);
                          
                          // Enhanced URL building using OpenAI trading parameter extraction
                          let url = 'https://changenow.io';
                          
                          try {
                            // Extract the original user query - prioritize originalQuery prop
                            let userQuery = originalQuery;
                            log('🔍 Initial userQuery from originalQuery prop:', userQuery);
                            
                            // If no originalQuery provided, try to extract from content
                            if (!userQuery) {
                              log('⚠️ No originalQuery prop, extracting from content...');
                              // Try to extract from content first (look for patterns like "Buy", "Swap", etc.)
                              const buyMatch = content.match(/Buy[:\s]+([^.]*)/i);
                              const swapMatch = content.match(/Swap[:\s]+([^.]*)/i);
                              const sellMatch = content.match(/Sell[:\s]+([^.]*)/i);
                              const tradeMatch = content.match(/Trade[:\s]+([^.]*)/i);
                              
                              if (buyMatch) userQuery = `Buy ${buyMatch[1].trim()}`;
                              else if (swapMatch) userQuery = `Swap ${swapMatch[1].trim()}`;
                              else if (sellMatch) userQuery = `Sell ${sellMatch[1].trim()}`;
                              else if (tradeMatch) userQuery = `Trade ${tradeMatch[1].trim()}`;
                              
                              // Fallback: use the entire content as query if no pattern found
                              if (!userQuery && typeof content === 'string') {
                                userQuery = content;
                              }
                              
                              // If still no query, try to build from title
                              if (!userQuery && title.includes('Exchange')) {
                                const titleMatch = title.match(/(\w+)\s+Exchange/i);
                                if (titleMatch) {
                                  userQuery = `Buy ${titleMatch[1]} with USD`;
                                }
                              }
                            }
                            
                            log('🎯 Final userQuery for OpenAI:', userQuery);
                            
                            if (!userQuery) {
                              logError('❌ No userQuery available for OpenAI extraction!');
                              return;
                            }
                            
                            log('🤖 Extracting parameters from:', userQuery);
                            
                            // Use OpenAI to extract trading parameters
                            const params = await extractTradingParameters(userQuery);
                            
                            if (params && params.from_currency && params.to_currency) {
                              log('✅ Extracted parameters:', params);
                              log('🔢 Raw amount from API:', params.amount, typeof params.amount);
                              
                              // Enhanced token mapping for ChangeNOW compatibility
                              const tokenMappings = {
                                'usdt': 'usdt',    // Tether (crypto)
                                'usd': 'usd',      // US Dollar (fiat)
                                'ton': 'ton',      // Toncoin
                                'btc': 'btc',      // Bitcoin
                                'bitcoin': 'btc',  // Bitcoin (full name)
                                'eth': 'eth',      // Ethereum
                                'ethereum': 'eth', // Ethereum (full name)
                                'bnb': 'bnb',      // Binance Coin
                                'sol': 'sol',      // Solana
                                'solana': 'sol',   // Solana (full name)
                                'ada': 'ada',      // Cardano
                                'cardano': 'ada',  // Cardano (full name)
                                'dot': 'dot',      // Polkadot
                                'polkadot': 'dot', // Polkadot (full name)
                                'matic': 'matic',  // Polygon
                                'polygon': 'matic', // Polygon (full name)
                                'avax': 'avax',    // Avalanche
                                'avalanche': 'avax', // Avalanche (full name)
                                'xrp': 'xrp',      // Ripple
                                'ripple': 'xrp',   // Ripple (full name)
                                'doge': 'doge',    // Dogecoin
                                'dogecoin': 'doge', // Dogecoin (full name)
                                'ltc': 'ltc',      // Litecoin
                                'litecoin': 'ltc',  // Litecoin (full name)
                                'usdc': 'usdc',    // USD Coin
                                'dai': 'dai',      // Dai
                                'link': 'link',    // Chainlink
                                'chainlink': 'link' // Chainlink (full name)
                              };
                              
                              // Normalize token symbols
                              let fromToken = params.from_currency.toLowerCase();
                              let toToken = params.to_currency.toLowerCase();
                              
                              fromToken = tokenMappings[fromToken] || fromToken;
                              toToken = tokenMappings[toToken] || toToken;
                              
                              // Smart token handling based on operation type
                              if (params.operation_type === 'buy') {
                                // For buy operations, prefer fiat as source when available
                                if (fromToken === 'usdt' && toToken !== 'usd') {
                                  fromToken = 'usd'; // Use fiat USD for purchases
                                }
                              } else if (params.operation_type === 'sell') {
                                // For sell operations, ensure we're selling crypto for fiat/stablecoin
                                if (toToken === 'usd' && fromToken !== 'usdt') {
                                  // Keep as fiat USD
                                } else if (toToken === 'usd') {
                                  toToken = 'usdt'; // Use USDT if specifically selling for USD
                                }
                              }
                              
                              // Ensure amount is valid (minimum 1, use extracted amount or default)
                              let amount;
                              if (params.amount !== null && params.amount !== undefined && !isNaN(params.amount)) {
                                amount = Math.max(1, Number(params.amount));
                              } else {
                                amount = 1; // Default amount
                              }
                              
                              log('💰 Final calculated amount:', amount, '(from params.amount:', params.amount, ')');
                              
                              // Build the ChangeNOW URL with extracted parameters
                              url = `https://changenow.io/exchange?from=${fromToken}&to=${toToken}&amount=${amount}`;
                              
                              log('🎯 Built URL with AI parameters:', {
                                from: fromToken,
                                to: toToken,
                                amount: amount,
                                operation: params.operation_type,
                                url: url
                              });
                            } else {
                              log('⚠️ AI extraction failed, using fallback logic');
                              
                              // Fallback to original regex-based approach
                          const swapMatch = content.match(/Swap: (\w+) → (\w+)/);
                          if (swapMatch) {
                            let fromToken = swapMatch[1].toLowerCase();
                            let toToken = swapMatch[2].toLowerCase();
                            
                                // Apply basic token mappings
                                const basicMappings = {
                                  'usdt': 'usdt', 'usd': 'usd', 'ton': 'ton', 'btc': 'btc', 'eth': 'eth'
                                };
                                
                                fromToken = basicMappings[fromToken] || fromToken;
                                toToken = basicMappings[toToken] || toToken;
                            
                            url = `https://changenow.io/exchange?from=${fromToken}&to=${toToken}&amount=1`;
                              } else if (title.includes('Exchange')) {
                            const titleMatch = title.match(/(\w+)\s+Exchange/i);
                            if (titleMatch) {
                              const targetToken = titleMatch[1].toLowerCase();
                              url = `https://changenow.io/exchange?from=usd&to=${targetToken}&amount=1`;
                                }
                              }
                            }
                          } catch (error) {
                            logError('🚨 Error in AI parameter extraction:', error);
                            
                            // Fallback: Still try OpenAI extraction if the main try block failed
                            try {
                              log('🔄 Attempting OpenAI extraction in fallback...');
                              if (userQuery) {
                                const fallbackParams = await extractTradingParameters(userQuery);
                                
                                if (fallbackParams && fallbackParams.from_currency && fallbackParams.to_currency) {
                                  log('✅ Fallback OpenAI extraction succeeded:', fallbackParams);
                                  
                                  // Use basic token mappings for fallback
                                  const basicMappings = {
                                    'usdt': 'usdt', 'usd': 'usd', 'ton': 'ton', 'btc': 'btc', 
                                    'eth': 'eth', 'sol': 'sol', 'ada': 'ada', 'dot': 'dot'
                                  };
                                  
                                  const fromToken = basicMappings[fallbackParams.from_currency.toLowerCase()] || fallbackParams.from_currency.toLowerCase();
                                  const toToken = basicMappings[fallbackParams.to_currency.toLowerCase()] || fallbackParams.to_currency.toLowerCase();
                                  const amount = Math.max(1, Number(fallbackParams.amount) || 1);
                                  
                                  url = `https://changenow.io/exchange?from=${fromToken}&to=${toToken}&amount=${amount}`;
                                  log('🎯 Fallback OpenAI URL built:', url);
                                } else {
                                  throw new Error('Fallback OpenAI extraction failed');
                                }
                              } else {
                                throw new Error('No user query for fallback');
                              }
                            } catch (fallbackError) {
                              logError('🚨 Fallback OpenAI extraction also failed:', fallbackError);
                              
                              // Ultimate fallback - use basic pattern matching only as last resort
                              const swapMatch = content.match(/Swap: (\w+) → (\w+)/);
                              if (swapMatch) {
                                const fromToken = swapMatch[1].toLowerCase();
                                const toToken = swapMatch[2].toLowerCase();
                                url = `https://changenow.io/exchange?from=${fromToken}&to=${toToken}&amount=1`;
                                log('🔧 Ultimate regex fallback URL:', url);
                              }
                            }
                          }
                          
                          log('🌐 Opening ChangeNOW with URL:', url);
                          
                          // Always open in new browser tab (not in-app browser)
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="relative z-50 pointer-events-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold rounded-full transition-all duration-300 shadow-2xl shadow-orange-500/40 hover:shadow-orange-400/60 hover:scale-105 border-2 border-orange-400/50 hover:border-orange-300 cursor-pointer active:scale-95"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <span className="relative z-10">💱 Exchange Now</span>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-orange-500/20 animate-pulse"></div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(bubble, document.body);
};

FloatingChangeNowBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string
};

export default FloatingChangeNowBubble;
