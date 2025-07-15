import { useState } from "react";
import PropTypes from "prop-types";

const Portfolio = ({ meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
    setIsClosing(false);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
    }, 300);
  };

  if (!meta?.length) return null;

  // Filter out tokens with 0 amount
  const heldTokens = meta.filter((token) => token.amount > 0);
  const otherTokens = meta.filter((token) => token.amount === 0);

  return (
    <div className="mt-2">
      {isExpanded ? (
        <div
          className="grid grid-cols-1 gap-2 relative"
          onClick={handleCollapse}
        >
          {/* Held Tokens Section */}
          {heldTokens.length > 0 && (
            <>
              <div className="text-xs text-gray-400 mb-1">Your Holdings</div>
              {heldTokens.map((token, index) => (
                <div
                  key={token.coinId}
                  className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg opacity-0 translate-y-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  style={{
                    animation: isClosing
                      ? "fadeOut 0.3s ease-out forwards"
                      : `fadeUp 0.5s ease-out forwards ${index * 0.1}s`,
                  }}
                >
                  <img
                    src={token.imgUrl}
                    alt={token.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">
                          {token.name}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {token.symbol}
                        </span>
                      </div>
                      <span className="text-xs text-gray-300">
                        ${(token.price * token.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {token.amount.toFixed(4)} {token.symbol}
                      </span>
                      <span
                        className={`text-xs ${token.pCh24h >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                      >
                        {token.pCh24h >= 0 ? "+" : ""}
                        {token.pCh24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Other Tokens Section */}
          {otherTokens.length > 0 && (
            <>
              <div className="text-xs text-gray-400 mt-3 mb-1">
                Other Tokens
              </div>
              {otherTokens.map((token, index) => (
                <div
                  key={token.coinId}
                  className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg opacity-0 translate-y-4 cursor-pointer"
                  style={{
                    animation: isClosing
                      ? "fadeOut 0.3s ease-out forwards"
                      : `fadeUp 0.5s ease-out forwards ${(heldTokens.length + index) * 0.1
                      }s`,
                  }}
                >
                  <img
                    src={token.imgUrl}
                    alt={token.name}
                    className="w-6 h-6 rounded-full opacity-50"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-400 text-sm">
                          {token.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {token.symbol}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ${token.price.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Not held</span>
                      <span
                        className={`text-xs ${token.pCh24h >= 0
                            ? "text-green-500/50"
                            : "text-red-500/50"
                          }`}
                      >
                        {token.pCh24h >= 0 ? "+" : ""}
                        {token.pCh24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div
          onClick={handleExpand}
          className="group inline-flex items-center gap-3 bg-gray-900/80 hover:bg-gray-900 rounded-lg px-3 py-2 cursor-pointer transition-all duration-300"
        >
          <div className="flex -space-x-2">
            {meta.slice(0, 3).map((token, index) => (
              <div
                key={token.coinId}
                className="ring-1 ring-gray-800 rounded-full"
                style={{ zIndex: 3 - index }}
              >
                <img
                  src={token.imgUrl}
                  alt={token.name}
                  className={`w-6 h-6 rounded-full ${token.amount === 0 ? "opacity-50" : ""
                    }`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-medium">
              $
              {meta
                .reduce((total, token) => total + token.price * token.amount, 0)
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </span>
            <svg
              className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transform group-hover:translate-x-0.5 transition-all duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

Portfolio.propTypes = {
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      coinId: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      pCh24h: PropTypes.number.isRequired,
      imgUrl: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Portfolio;
