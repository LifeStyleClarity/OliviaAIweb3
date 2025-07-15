import { useState } from "react";
import PropTypes from "prop-types";
import { Globe, X } from "lucide-react";

const TokenInfo = ({ meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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

  if (!meta?.tokenData?.tokenData) return null;

  const token = meta.tokenData.tokenData;

  const StatBox = ({ label, value, change, prefix = "" }) => (
    <div className="bg-gray-950/50 p-2 rounded">
      <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-medium">
          {prefix}
          {value}
        </span>
        {change && (
          <span
            className={`text-[10px] ${
              change >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </div>
  );

  StatBox.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    change: PropTypes.number,
    prefix: PropTypes.string,
  };

  const TabButton = ({ label, isActive, onClick }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
        isActive
          ? "bg-gray-800 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
      }`}
    >
      {label}
    </button>
  );

  TabButton.propTypes = {
    label: PropTypes.node.isRequired,
    isActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Market Cap"
                value={token.marketCap.toLocaleString()}
                prefix="$"
              />
              <StatBox
                label="Volume 24h"
                value={token.volume.toLocaleString()}
                prefix="$"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Available Supply"
                value={token.availableSupply.toLocaleString()}
              />
              <StatBox
                label="Total Supply"
                value={token.totalSupply.toLocaleString()}
              />
            </div>
            {(token.websiteUrl || token.twitterUrl || token.redditUrl) && (
              <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                {token.websiteUrl && (
                  <a
                    href={token.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] bg-gray-950/50 py-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <Globe size={12} />
                    Website
                  </a>
                )}
                {token.twitterUrl && (
                  <a
                    href={token.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] bg-gray-950/50 py-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <img
                      src="/x-logo.png"
                      alt="X"
                      className="w-3 h-3 opacity-75"
                    />
                    Twitter
                  </a>
                )}
                {token.redditUrl && (
                  <a
                    href={token.redditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] bg-gray-950/50 py-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    <img
                      src="/telegram-logo.png"
                      alt="Telegram"
                      className="w-3 h-3 opacity-75"
                    />
                    Telegram
                  </a>
                )}
              </div>
            )}
          </div>
        );
      case "community":
        return (
          <div className="space-y-3">
            {meta.comPostSummary ? (
              <div className="bg-gray-950/50 p-2 rounded text-[10px] text-gray-300">
                {meta.comPostSummary}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 text-center py-4">
                No community posts available
              </div>
            )}
          </div>
        );
      case "dev":
        return (
          <div className="space-y-3">
            {meta.devPostSummary ? (
              <div className="bg-gray-950/50 p-2 rounded text-[10px] text-gray-300">
                {meta.devPostSummary}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 text-center py-4">
                No developer posts available
              </div>
            )}
          </div>
        );
      case "telegram":
        return (
          <div className="space-y-3">
            {meta.telegramSummary ? (
              <div className="bg-gray-950/50 p-2 rounded text-[10px] text-gray-300">
                {meta.telegramSummary}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 text-center py-4">
                No Telegram posts available
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-2">
      {isExpanded ? (
        <div
          className="bg-gray-900 rounded-lg opacity-0 translate-y-4 overflow-hidden max-w-sm"
          style={{
            animation: isClosing
              ? "fadeOut 0.3s ease-out forwards"
              : "fadeUp 0.5s ease-out forwards",
          }}
          onClick={handleCollapse}
        >
          {/* Header */}
          <div className="p-2 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={token.icon}
                  alt={token.name}
                  className="w-7 h-7 rounded"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{token.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">
                      ${token.price.toFixed(8)}
                    </span>
                    <span
                      className={`text-[10px] px-1 rounded ${
                        token.priceChange1d >= 0
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {token.priceChange1d >= 0 ? "+" : ""}
                      {token.priceChange1d}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollapse();
                }}
                className="p-1 hover:bg-gray-800/50 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              <TabButton
                label={
                  <span className="flex items-center gap-1">
                    <Globe size={12} />
                    Overview
                  </span>
                }
                isActive={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <TabButton
                label={
                  <span className="flex items-center gap-1">
                    <img
                      src="/x-logo.png"
                      alt="X"
                      className="w-3 h-3 opacity-75"
                    />
                    Sentiment
                  </span>
                }
                isActive={activeTab === "community"}
                onClick={() => setActiveTab("community")}
              />
              <TabButton
                label={
                  <span className="flex items-center gap-1">
                    <img
                      src="/x-logo.png"
                      alt="X"
                      className="w-3 h-3 opacity-75"
                    />
                    Dev
                  </span>
                }
                isActive={activeTab === "dev"}
                onClick={() => setActiveTab("dev")}
              />
              <TabButton
                label={
                  <span className="flex items-center gap-1">
                    <img
                      src="/telegram-logo.png"
                      alt="Telegram"
                      className="w-3 h-3 opacity-75"
                    />
                    TG
                  </span>
                }
                isActive={activeTab === "telegram"}
                onClick={() => setActiveTab("telegram")}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-2">{renderTabContent()}</div>
        </div>
      ) : (
        <div
          onClick={handleExpand}
          className="inline-flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-all duration-300"
        >
          <img
            src={token.icon}
            alt={token.name}
            className="w-6 h-6 rounded-full"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{token.name}</span>
              <span className="text-gray-400 text-xs">{token.symbol}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">${token.price.toFixed(8)}</span>
              <span
                className={`text-xs ${
                  token.priceChange1d >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {token.priceChange1d >= 0 ? "+" : ""}
                {token.priceChange1d}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

TokenInfo.propTypes = {
  meta: PropTypes.shape({
    tokenData: PropTypes.shape({
      tokenData: PropTypes.shape({
        id: PropTypes.string,
        icon: PropTypes.string,
        name: PropTypes.string,
        symbol: PropTypes.string,
        price: PropTypes.number,
        priceChange1d: PropTypes.number,
        marketCap: PropTypes.number,
        volume: PropTypes.number,
        availableSupply: PropTypes.number,
        totalSupply: PropTypes.number,
        websiteUrl: PropTypes.string,
        twitterUrl: PropTypes.string,
        redditUrl: PropTypes.string,
      }),
    }),
    devPosts: PropTypes.object,
    devPostSummary: PropTypes.string,
    communityPosts: PropTypes.array,
    comPostSummary: PropTypes.string,
    telegramMessages: PropTypes.object,
    telegramSummary: PropTypes.string,
  }),
};

export default TokenInfo;
