import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import changeNowLogo from './change now .png';

const FloatingChangeNowBubble = ({ isOpen, onClose, title = 'ChangeNOW', content = '', loading = false, addParticlesToSwarm }) => {
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
        const bubbleSize = isExpanded ? 280 : 128; // Match expanded size
        const margin = 20;
        
        // Simple upward floating 
        let newY = prev.y - 1; // Constant upward movement
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
    
    const bubbleSize = isExpanded ? 280 : 128;
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

  const bubbleSize = isExpanded ? 280 : 128; // Match Hedera bubble size

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
      <div className="w-full h-full bg-transparent border border-orange-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative" style={{boxShadow: '0 0 20px #fb923c, inset 0 0 10px rgba(251, 146, 60, 0.2)'}}>
        {/* Neon orange glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-orange-300 animate-pulse" style={{boxShadow: '0 0 15px #fb923c'}}></div>
        
        {/* ChangeNOW Logo at top */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-orange-500/70 shadow-lg shadow-orange-500/40">
            <img src={changeNowLogo} alt="ChangeNOW Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0.5 right-0.5 text-white hover:text-red-400 w-4 h-4 rounded-full bg-black/30 hover:bg-black/50 transition-all text-xs font-bold flex items-center justify-center border border-orange-400/50 z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content area */}
        <div className="flex-1 p-1 pt-8 overflow-auto flex flex-col items-center justify-center relative z-10">
          {loading ? (
            <div className={`${isExpanded ? 'text-sm' : 'text-[6px]'} text-white font-medium animate-pulse text-center`}>
              <div className="flex items-center gap-0.5 justify-center">
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`}></div>
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                <div className={`${isExpanded ? 'w-3 h-3' : 'w-0.5 h-0.5'} bg-white rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="mt-0.5">Loading</div>
            </div>
          ) : (
            <>
              <div className={`text-white ${isExpanded ? 'text-xs' : 'text-[6px]'} ${isExpanded ? 'leading-tight' : 'leading-[1]'} break-words w-full text-center flex-grow flex items-start justify-center ${isExpanded ? 'pt-2' : ''}`}>
                <div className={`${isExpanded ? 'max-h-full overflow-y-auto px-2' : 'max-h-full overflow-hidden'} whitespace-pre-wrap font-mono ${isExpanded ? 'font-medium' : 'font-bold'} ${isExpanded ? 'text-center' : ''}`}>
                  {content}
                </div>
              </div>
              {/* Swap button - only show when expanded */}
              {isExpanded && content.includes('changenow.io/exchange/') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const urlMatch = content.match(/changenow\.io\/exchange\/([^\\n]+)/);
                    if (urlMatch) {
                      window.open(`https://${urlMatch[0]}`, '_blank');
                    }
                  }}
                  className="mt-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-full transition-colors duration-200 shadow-lg"
                >
                  🔗 Swap Now
                </button>
              )}
            </>
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
  addParticlesToSwarm: PropTypes.func
};

export default FloatingChangeNowBubble;
