import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import coingeckoIcon from '../../assets/coingecko-icon.png';

const FloatingCoinGeckoBubble = ({ isOpen, onClose, title = 'CoinGecko', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `coingecko-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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
        // Use same dynamic sizing as outside
        let bubbleSize = 128;
        if (isExpanded && typeof content === 'string') {
          const lines = content.split('\n').length;
          const avgLineLength = content.length / lines;
          const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));
          const estimatedHeight = Math.max(200, lines * 20 + 80);
          bubbleSize = Math.max(estimatedWidth, estimatedHeight);
        } else if (isExpanded) {
          bubbleSize = 300;
        }
        const margin = 20;
        
        // Simple upward floating - no hard stops
        let newY = prev.y;
        let newX = prev.x;
        
        // Always try to float up (like a balloon)
        const floatForce = -1.0; // Faster upward force (2x speed)
        newY += floatForce;
        
        // Stop at top of screen naturally
        if (newY < margin) {
          newY = margin;
        }
        
        // Keep X within screen bounds
        const maxX = window.innerWidth - bubbleSize - margin;
        const minX = margin;
        newX = Math.max(minX, Math.min(maxX, newX));
        
        // Gentle collision avoidance
        const allBubbles = Array.from(document.querySelectorAll('[data-bubble]'));
        const otherBubbles = allBubbles.filter(b => b.getAttribute('data-bubble-id') !== bubbleId);
        
        otherBubbles.forEach(otherBubble => {
          const otherRect = otherBubble.getBoundingClientRect();
          const otherCenterX = otherRect.left + otherRect.width / 2;
          const otherCenterY = otherRect.top + otherRect.height / 2;
          const thisCenterX = newX + bubbleSize / 2;
          const thisCenterY = newY + bubbleSize / 2;
          
          const distance = Math.sqrt(
            Math.pow(thisCenterX - otherCenterX, 2) + 
            Math.pow(thisCenterY - otherCenterY, 2)
          );
          
          const minDistance = bubbleSize + 10;
          
          // Gentle collision avoidance - small pushes
          if (distance < minDistance && distance > 0) {
            const angle = Math.atan2(thisCenterY - otherCenterY, thisCenterX - otherCenterX);
            const overlap = minDistance - distance;
            
            // Very gentle push - small incremental movements
            const pushForce = overlap * 0.02; // Much smaller force
            newX += Math.cos(angle) * pushForce;
            newY += Math.sin(angle) * pushForce;
          }
        });
        
        // SOLID BOUNDARIES - Absolutely prevent going off-screen
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(margin, newY); // Can't go above top
        newY = Math.min(window.innerHeight - bubbleSize - margin, newY); // Can't go below bottom
        
        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded]);

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    // Use same dynamic sizing logic\n    let bubbleSize = 128;\n    if (isExpanded && typeof content === 'string') {\n      const lines = content.split('\\n').length;\n      const avgLineLength = content.length / lines;\n      const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));\n      const estimatedHeight = Math.max(200, lines * 20 + 80);\n      bubbleSize = Math.max(estimatedWidth, estimatedHeight);\n    } else if (isExpanded) {\n      bubbleSize = 300;\n    }
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
    
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
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
    if (isDragging) {
      setIsDragging(false);
      // Bubble will resume upward floating automatically
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 128; // Base collapsed size
  if (isExpanded && typeof content === 'string') {
    // Calculate size based on content length
    const lines = content.split('\n').length;
    const avgLineLength = content.length / lines;
    const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));
    const estimatedHeight = Math.max(200, lines * 20 + 80);
    bubbleSize = Math.max(estimatedWidth, estimatedHeight);
  } else if (isExpanded) {
    bubbleSize = 300; // Default expanded size
  }
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483646, // Slightly lower than Lurky
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="coingecko"
      data-bubble-id={bubbleId}
    >
                   <div className="w-full h-full bg-transparent border border-green-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative" style={{boxShadow: '0 0 20px #4ade80, inset 0 0 10px rgba(74, 222, 128, 0.2)'}}>
        {/* Neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-green-300 animate-pulse" style={{boxShadow: '0 0 15px #4ade80'}}></div>
        
        {/* Profile picture at top */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-green-600/70 shadow-lg shadow-green-500/40">
            <img 
              src={coingeckoIcon} 
              alt="CoinGecko" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0.5 right-0.5 text-white hover:text-red-400 w-4 h-4 rounded-full bg-black/30 hover:bg-black/50 transition-all text-xs font-bold flex items-center justify-center border border-green-400/50 z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content area */}
        <div className="flex-1 pt-6 pb-2 px-1 overflow-hidden flex items-center justify-center relative z-10">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold">Loading</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex items-center justify-center text-center">
                            {!isExpanded ? (
                // Collapsed: Show coin name + price
                <div className="text-xs font-bold leading-tight px-2">
                  {(() => {
                    if (typeof content === 'string') {
                      const lines = content.split('\n').filter(line => line.trim());
                      
                      // Try to extract coin name from first line
                      const firstLine = lines[0] || '';
                      let coinName = '';
                      
                      // Extract coin name from patterns like "Bitcoin (BTC) Market Stats" or "Bitcoin (BTC) - Olivia thought"
                      const nameMatch = firstLine.match(/^([^(]+)\s*\([^)]+\)/);
                      if (nameMatch) {
                        coinName = nameMatch[1].trim();
                      }
                      
                      // Find price line
                      const priceLine = lines.find(line => 
                        line.includes('Price:') && line.includes('$')
                      );
                      
                      if (coinName && priceLine) {
                        // Extract price from "Price: $X.XX" format
                        const priceMatch = priceLine.match(/Price:\s*\$([\d,\.]+[kK]?)/i);
                        const price = priceMatch ? `$${priceMatch[1]}` : priceLine.replace('Price:', '').trim();
                        return `${coinName} - ${price}`;
                      }
                      
                      // Fallback to price line or first line
                      return priceLine || firstLine || content.substring(0, 30) + '...';
                    }
                    return 'Click to expand';
                  })()} 
                </div>
              ) : (
                // Expanded: Show all details
                <div className="text-xs leading-relaxed break-words w-full h-full px-4 py-3 flex items-center justify-center">
                  <div className="text-center">
                    {typeof content === 'string' ? (
                      <div className="whitespace-pre-wrap font-medium">
                        {content}
                      </div>
                    ) : (
                      <div className="font-mono font-medium">
                        {JSON.stringify(content, null, 2)}
                      </div>
                    )}
                  </div>
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

FloatingCoinGeckoBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingCoinGeckoBubble;
