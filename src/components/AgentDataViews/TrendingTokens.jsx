import { useState } from "react";
import PropTypes from "prop-types";
import { AvatarGroup, Avatar } from "@heroui/react";

const TrendingTokens = ({ meta }) => {
  const [expandedTokens, setExpandedTokens] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleExpand = () => {
    setExpandedTokens(true);
    setIsClosing(false);
  };

  const handleCollapse = () => {
    setExpandedTokens(false);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
    }, 300);
  };

  if (!meta?.length) return null;

  return (
    <div className="mt-2">
      {expandedTokens ? (
        <div
          className="grid grid-cols-1 gap-2 relative"
          onClick={handleCollapse}
        >
          {meta.map((token, tokenIndex) => (
            <div
              key={token.id}
              className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg opacity-0 translate-y-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
              style={{
                animation: isClosing
                  ? "fadeOut 0.3s ease-out forwards"
                  : `fadeUp 0.5s ease-out forwards ${tokenIndex * 0.1}s`,
              }}
            >
              <img
                src={token.icon}
                alt={token.name}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{token.name}</span>
                  <span className="text-gray-400 text-xs">{token.symbol}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-gray-300 text-xs">
                    ${token.price.toFixed(4)}
                  </span>
                  <span
                    className={`text-xs ${
                      token.priceChange1d >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {token.priceChange1d >= 0 ? "+" : ""}
                    {token.priceChange1d.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={handleExpand}
          className="inline-block cursor-pointer transition-all duration-300 hover:scale-105"
        >
          <AvatarGroup
            isBordered
            max={6}
            total={meta.length}
            size="sm"
            className="bg-transparent rounded-full p-1"
          >
            {meta.map((token) => (
              <Avatar
                key={token.id}
                src={token.icon}
                alt={token.name}
                isBordered={false}
                color="#111722"
              />
            ))}
          </AvatarGroup>
        </div>
      )}
    </div>
  );
};

TrendingTokens.propTypes = {
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      priceChange1d: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default TrendingTokens;
