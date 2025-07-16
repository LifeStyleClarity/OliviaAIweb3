import PropTypes from "prop-types";
import Portfolio from "../AgentDataViews/Portfolio";
import TrendingTokens from "../AgentDataViews/TrendingTokens";
import TokenInfo from "../AgentDataViews/TokenInfo";
import TwitterUsername from "../AgentDataViews/TwitterUsername";
import TrendingTopics from "../AgentDataViews/TrendingTopics";
import SwapAction from "../AgentDataViews/SwapAction";
import MultipleTokenOptions from "../AgentDataViews/MultipleTokenOptions";

const ChatActionRenderer = ({
  action_type,
  sub_action_type,
  meta,
  amount,
  swap_type,
  contract_address,
  onSendMessage,
}) => {
  if (action_type !== "action") return null;

  let transformedMeta;

  switch (sub_action_type) {
    case "top_trending_ton":
      return <TrendingTokens meta={meta} />;
    case "show_portfolio":
      return <Portfolio meta={meta || []} />;
    case "token_data_info":
      // Transform the new data structure to match what TokenInfo expects
      transformedMeta = {
        tokenData: {
          tokenData: meta.tokenData
        },
        devPostSummary: meta.devPostSummary,
        comPostSummary: meta.comPostSummary
      };
      return <TokenInfo meta={transformedMeta} />;
    case "twitter_username":
      return <TwitterUsername meta={meta} />;
    case "trending_topics":
      return <TrendingTopics meta={meta} />;
    case "swap":
      return (
        <SwapAction
          meta={meta}
          amount={amount}
          swap_type={swap_type}
          contract_address={contract_address}
          walletAddress={meta?.walletAddress}
        />
      );
    case "found_multiple_ca":
      return (
        <MultipleTokenOptions
          meta={meta}
          onSendMessage={onSendMessage}
          swap_type={swap_type}
        />
      );
    
    // New action types for enhanced streaming system
    case "web_search_results":
      return (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Web Search Results</h4>
          <div className="text-sm text-blue-800">
            {meta?.results ? `Found ${meta.results.length} results` : 'Searching...'}
          </div>
        </div>
      );
      
    case "thinking":
      return (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-purple-700">Thinking...</span>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

ChatActionRenderer.propTypes = {
  action_type: PropTypes.string.isRequired,
  sub_action_type: PropTypes.string,
  meta: PropTypes.any,
  amount: PropTypes.number,
  swap_type: PropTypes.string,
  contract_address: PropTypes.string,
  onSendMessage: PropTypes.func,
};

export default ChatActionRenderer;
