import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const InAppBrowser = ({ isOpen, url, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
      setIsLoading(true);
      setIsBlocked(false);
      
      // Set a timeout to detect blocked content
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setIsBlocked(true);
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [url, isLoading]);

  // Handle ESC key to close browser
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIsBlocked(true);
  };

  if (!isOpen || !currentUrl) return null;

  const browserContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full h-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="flex-1 bg-gray-800 rounded px-3 py-1 text-sm text-gray-300 truncate">
              {currentUrl}
            </div>
          </div>
          <button
            onClick={() => window.open(currentUrl, '_blank')}
            className="ml-3 text-blue-400 hover:text-blue-300 text-sm"
          >
            Open External
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && !isBlocked && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-gray-400">Loading...</span>
          </div>
        )}

        {/* Blocked content message */}
        {isBlocked && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-2">Content Blocked</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              This website prevents embedding for security reasons. You can still access it in a new tab.
            </p>
            <button
              onClick={() => window.open(currentUrl, '_blank')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Open in New Tab
            </button>
          </div>
        )}

        {/* Browser content */}
        {!isBlocked && (
          <div className="flex-1 relative">
            <iframe
              src={currentUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="In-App Browser"
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
          In-App Browser • Press ESC or click ✕ to close
        </div>
      </div>
    </div>
  );

  return createPortal(browserContent, document.body);
};

export default InAppBrowser;
