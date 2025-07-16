import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Globe } from 'lucide-react';
import PropTypes from 'prop-types';

const SourcesDrawer = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no sources
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 border border-gray-200 rounded-lg bg-gray-50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Sources ({sources.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-200">
          {sources.map((source, index) => (
            <div
              key={index}
              className="p-3 bg-white rounded border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 leading-tight mb-1 overflow-hidden">
                        <span className="block truncate">
                          {source.title || source.url}
                        </span>
                      </h4>
                      {source.description && (
                        <p className="text-xs text-gray-600 mb-2 leading-relaxed overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {source.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {source.url}
                        </span>
                        {source.date && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            • {source.date}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:underline border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      Visit
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

SourcesDrawer.propTypes = {
  sources: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      url: PropTypes.string.isRequired,
      description: PropTypes.string,
      date: PropTypes.string
    })
  )
};

export default SourcesDrawer; 