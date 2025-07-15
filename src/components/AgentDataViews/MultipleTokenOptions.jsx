import PropTypes from "prop-types";

const MultipleTokenOptions = ({ meta, onSendMessage, swap_type }) => {
  const handleTokenSelect = (contractAddress) => {
    const messageText = `${swap_type} This token with ${contractAddress}`;
    onSendMessage(messageText);
  };

  return (
    <div className="mt-2 space-y-2">
      {meta.map((token) => (
        <div
          key={token.id}
          className="w-full flex items-center gap-2 bg-[#1C1C1E] rounded-lg p-2.5"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <img
              src={token.icon}
              alt={token.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm text-gray-200">{token.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400">
              ${token.price.toFixed(8)}
              <div className="text-[10px] text-gray-500">
                Vol: ${token.volume.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => handleTokenSelect(token.contractAddress)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {swap_type}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

MultipleTokenOptions.propTypes = {
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      volume: PropTypes.number.isRequired,
      contractAddress: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  swap_type: PropTypes.string,
};

export default MultipleTokenOptions;
