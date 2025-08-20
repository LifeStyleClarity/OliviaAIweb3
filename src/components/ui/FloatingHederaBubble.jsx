import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import hederaLogo from '../../assets/hedera-logo.png';

const FloatingHederaBubble = ({ isOpen, onClose, title = 'Hedera', content = '', loading = false }) => {
  const bubbleId = useState(() => `hedera-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
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
    if (isDragging) {
      setIsDragging(false);
      // Bubble will resume upward floating automatically
    }
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    // Toggle expanded state
    setIsExpanded(prev => !prev);
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

  // Dynamic bubble size based on expanded state
  let bubbleSize = 140; // Base collapsed size
  if (isExpanded) {
    bubbleSize = 380; // Expanded size for content
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
        zIndex: 2147483644, // Lower than others
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="hedera"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-green-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-green-300/60 animate-pulse" style={{boxShadow: '0 0 25px #4ade80, 0 0 50px rgba(74, 222, 128, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-green-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 mb-2 bg-black/20">
                <img 
                  src={hederaLogo} 
                  alt="Hedera Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-green-400">Loading...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central Hedera Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 hover:border-green-300 transition-all duration-300 hover:shadow-green-400/80 hover:scale-105 group">
                      <img 
                        src={hederaLogo} 
                        alt="Hedera Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-green-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
              ) : (
                // Expanded: Spherical layout with enhanced content
                <div className="w-full h-full flex flex-col">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 mx-auto mb-2">
                      <img 
                        src={hederaLogo} 
                        alt="Hedera Logo" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Hashgraph Network</div>
                  </div>
                  
                  {/* Central content area - spherical text flow */}
                  <div className="flex-1 flex items-center justify-center mt-24 mb-4 max-w-full overflow-hidden">
                    <div className="text-center px-4">
                      {typeof content === 'string' ? (
                        <ReactMarkdown className="whitespace-pre-wrap font-medium text-xs text-white/90 leading-relaxed prose prose-invert max-w-none">
                          {content}
                        </ReactMarkdown>
                      ) : (
                        <div className="font-mono text-xs text-green-300 bg-black/30 p-3 rounded-full border border-green-400/30 max-w-full">
                          {JSON.stringify(content, null, 2)}
                        </div>
                      )}
                    </div>
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

FloatingHederaBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
};

export default FloatingHederaBubble;
