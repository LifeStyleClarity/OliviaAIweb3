import PropTypes from "prop-types";

import Button from "./Button";
import InlineICPIdentityCreator from "./InlineICPIdentityCreator";

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

  switch (sub_action_type) {
    case "twitter_username":
      return (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-600">Twitter: {meta?.username || 'N/A'}</span>
        </div>
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
      
    case "create_icp_identity":
      return <InlineICPIdentityCreator onSendMessage={onSendMessage} />;
      
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
