import { Search, Brain, Loader2 } from 'lucide-react';
import { Spinner } from '@heroui/react';
import PropTypes from 'prop-types';

const StreamingLoadingIndicator = ({ 
  isLoading = false, 
  currentAction = null, 
  actionStatus = null,
  isStreamingResponse = false 
}) => {
  // Only show if we're actually processing something meaningful
  if (!isLoading && !isStreamingResponse) {
    return null;
  }
  
  // Don't show if we're just connecting without any actual action
  if (!currentAction && !isStreamingResponse) {
    return null;
  }

  // Get the appropriate icon and styling based on current action
  const getActionConfig = () => {
    switch (currentAction) {
      case 'web_search':
        return {
          icon: <Search className="w-4 h-4 text-blue-600 animate-pulse" />,
          text: 'Searching web...',
          bgClass: 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200',
          textClass: 'text-blue-700',
          showPulse: true
        };
      
      case 'thinking':
        return {
          icon: <Brain className="w-4 h-4 text-purple-600 animate-pulse" />,
          text: 'Thinking...',
          bgClass: 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200',
          textClass: 'text-purple-700',
          showPulse: true
        };
      
      default:
        return {
          icon: <Spinner size="sm" />,
          text: isStreamingResponse ? 'Responding...' : 'Thinking...',
          bgClass: 'bg-gray-100',
          textClass: 'text-gray-600',
          showPulse: false
        };
    }
  };

  const config = getActionConfig();

  return (
    <div className="flex justify-start animate-fadeIn">
      <div className={`rounded-2xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ${config.bgClass} ${
        config.showPulse ? 'animate-pulse' : ''
      }`}>
        <div className="relative">
          {config.icon}
          {config.showPulse && (
            <div className="absolute -inset-1 bg-current rounded-full opacity-20 animate-ping"></div>
          )}
        </div>
        <span className={`font-medium ${config.textClass}`}>
          {config.text}
        </span>
        
        {/* Additional status indicator */}
        {actionStatus === 'in_progress' && (
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

StreamingLoadingIndicator.propTypes = {
  isLoading: PropTypes.bool,
  currentAction: PropTypes.string,
  actionStatus: PropTypes.string,
  isStreamingResponse: PropTypes.bool
};

// Using JavaScript default parameters instead of deprecated defaultProps

export default StreamingLoadingIndicator; 