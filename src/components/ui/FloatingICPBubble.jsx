import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, AlertCircle, Loader, Wifi, WifiOff, Shield, User } from 'lucide-react';
import icpLogo from '../../assets/icp-logo.jpg';

const FloatingICPBubble = ({ isOpen, onClose, title = 'ICP Status', content = '', loading = false, status = 'error', addParticlesToSwarm }) => {
  const bubbleId = useState(() => `icp-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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
          bubbleSize = 320; // Fixed size for visual status display
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
    
    // Dynamic bubble size based on expanded state
    let bubbleSize = 140; // Base collapsed size
    if (isExpanded) {
      bubbleSize = 320; // Fixed size for visual status display
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
  
  // Color scheme based on status
  const colors = {
    error: {
      border: 'border-red-400',
      shadow: '0 0 20px #ef4444, inset 0 0 10px rgba(239, 68, 68, 0.2)',
      glowBorder: 'border-red-300',
      glowShadow: '0 0 15px #ef4444'
    },
    success: {
      border: 'border-green-400',
      shadow: '0 0 20px #22c55e, inset 0 0 10px rgba(34, 197, 94, 0.2)',
      glowBorder: 'border-green-300',
      glowShadow: '0 0 15px #22c55e'
    },
    connecting: {
      border: 'border-blue-400',
      shadow: '0 0 20px #3b82f6, inset 0 0 10px rgba(59, 130, 246, 0.2)',
      glowBorder: 'border-blue-300',
      glowShadow: '0 0 15px #3b82f6'
    }
  };

  const theme = colors[status] || colors.error;
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 140; // Base collapsed size
  if (isExpanded) {
    // Fixed size for visual status display - no scrolling needed
    bubbleSize = 320; // Optimized size for icon-based content
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
        zIndex: 2147483645, // Lower than others
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="icp"
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
                  src={icpLogo} 
                  alt="ICP Logo" 
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
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central ICP Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 hover:border-green-300 transition-all duration-300 hover:shadow-green-400/80 hover:scale-105 group">
                      <img 
                        src={icpLogo} 
                        alt="ICP Logo" 
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
                // Expanded: Spherical content organization
                <div className="w-full h-full relative flex flex-col items-center justify-center p-6">
                  {/* Top section - Icon and title in circular arc */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 bg-gradient-to-br from-green-400/20 to-green-600/30 mb-2">
                      <img 
                        src={icpLogo} 
                        alt="ICP Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Network Status</div>
                  </div>
                  
                  {/* Central content area - visual status display */}
                  <div className="flex-1 flex items-center justify-center mt-16 mb-6 max-w-full">
                    <div className="text-center px-4 space-y-4">
                      {/* Parse and display content with icons */}
                      {(() => {
                        if (typeof content !== 'string') return null;
                        
                        const lines = content.split('\n').filter(line => line.trim());
                        const isConnected = content.includes('Connected');
                        const isError = content.includes('Error') || status === 'error';
                        const isConnecting = content.includes('Connecting') || status === 'connecting';
                        const backendActive = content.includes('Backend: Active');
                        const isAuthenticated = content.includes('Auth: Authenticated');
                        const hasPrincipal = content.includes('Principal:') && !content.includes('Principal: None');
                        
                        return (
                          <div className="space-y-3">
                            {/* Main Status */}
                            <div className="flex items-center justify-center gap-2">
                              {isConnected ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              ) : isError ? (
                                <AlertCircle className="w-6 h-6 text-red-400" />
                              ) : (
                                <Loader className="w-6 h-6 text-yellow-400 animate-spin" />
                              )}
                              <span className={`font-bold text-lg ${isConnected ? 'text-green-400' : isError ? 'text-red-400' : 'text-yellow-400'}`}>
                                {isConnected ? 'Connected' : isError ? 'Error' : 'Connecting'}
                              </span>
                            </div>
                            
                            {/* Network Status */}
                            <div className="space-y-2">
                              {/* Backend Status */}
                              <div className="flex items-center justify-center gap-2">
                                {backendActive ? (
                                  <Wifi className="w-4 h-4 text-green-400" />
                                ) : (
                                  <WifiOff className="w-4 h-4 text-orange-400" />
                                )}
                                <span className={`text-sm ${backendActive ? 'text-green-300' : 'text-orange-300'}`}>
                                  Backend: {backendActive ? 'Active' : 'Offline'}
                                </span>
                              </div>
                              
                              {/* Auth Status */}
                              <div className="flex items-center justify-center gap-2">
                                <Shield className={`w-4 h-4 ${isAuthenticated ? 'text-green-400' : 'text-blue-400'}`} />
                                <span className={`text-sm ${isAuthenticated ? 'text-green-300' : 'text-blue-300'}`}>
                                  Auth: {isAuthenticated ? 'Authenticated' : 'Available'}
                                </span>
                              </div>
                              
                              {/* Principal Status */}
                              {hasPrincipal && (
                                <div className="flex items-center justify-center gap-2">
                                  <User className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm text-blue-300">
                                    Principal: Connected
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
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

FloatingICPBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  status: PropTypes.oneOf(['error', 'success', 'connecting']),
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingICPBubble;
