import PropTypes from "prop-types";
import TwitterUsername from "../AgentDataViews/TwitterUsername";
import Button from "./Button";

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
      return <TwitterUsername meta={meta} />;
    
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
      return (
        <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-gray-700 mb-3">
            💡 Want to save your chat history permanently? Create an ICP identity to store your conversations securely on the blockchain!
          </div>
          <div className="flex gap-2">
            <Button
              variant="solid"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onPress={() => {
                // Trigger the account upgrade prompt
                if (window.showICPUpgrade) {
                  window.showICPUpgrade();
                }
              }}
            >
              🔐 Create ICP Identity
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onPress={() => onSendMessage && onSendMessage('Maybe later')}
            >
              Maybe later
            </Button>
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
