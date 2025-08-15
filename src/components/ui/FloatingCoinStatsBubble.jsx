import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import coinstatsLogo from '../../api/services/coinstats-2.png';

const FloatingCoinStatsBubble = ({ isOpen, onClose, title = 'CoinStats', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `coinstats-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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
        const bubbleSize = isExpanded ? 200 : 128;
        const margin = 20;
        
        // Simple upward floating - no hard stops
        let newY = prev.y;
        let newX = prev.x;
        
        // Always try to float up (like a balloon)
        const floatForce = -0.5; // Gentle upward force
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
  }, [isOpen, isDragging, isExpanded, bubbleId]);

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    const bubbleSize = isExpanded ? 200 : 128;
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
    
    // Check for double-click
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      createPopEffect();
      return;
    }
    setLastClickTime(currentTime);
    

    
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
  
  const bubbleSize = isExpanded ? 200 : 128;
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
        zIndex: 2147483643, // Lower than others
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      data-bubble="coinstats"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-transparent border border-blue-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative" style={{boxShadow: '0 0 20px #3b82f6, inset 0 0 10px rgba(59, 130, 246, 0.2)'}}>
        {/* Neon blue glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-blue-300 animate-pulse" style={{boxShadow: '0 0 15px #3b82f6'}}></div>
        
        {/* CoinStats Logo at top */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-blue-500/70 shadow-lg shadow-blue-500/40 bg-white">
            <img src={coinstatsLogo} alt="CoinStats Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0.5 right-0.5 text-white hover:text-red-400 w-4 h-4 rounded-full bg-black/30 hover:bg-black/50 transition-all text-xs font-bold flex items-center justify-center border border-blue-400/50 z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content area */}
        <div className="flex-1 p-0.5 pt-6 overflow-hidden flex items-center justify-center relative z-10">
          {loading ? (
            <div className={`${isExpanded ? 'text-sm' : 'text-[8px]'} text-white font-medium animate-pulse text-center`}>
              <div className="flex items-center gap-0.5 justify-center">
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`}></div>
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="mt-0.5">Loading</div>
            </div>
          ) : (
            <div className={`text-white ${isExpanded ? 'text-sm' : 'text-[8px]'} leading-[1] break-words w-full h-full overflow-hidden text-center flex items-center justify-center`}>
              {typeof content === 'string' ? (
                <div className="max-h-full overflow-hidden whitespace-pre-wrap font-mono font-bold">
                  {content}
                </div>
              ) : (
                <div className={`text-white ${isExpanded ? 'text-sm' : 'text-[8px]'} break-words leading-[1] font-mono max-h-full overflow-hidden`}>
                  {JSON.stringify(content, null, 1)}
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

FloatingCoinStatsBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingCoinStatsBubble;
