import { useState, useEffect } from 'react';
import icpService from '../../../api/services/icp.service';
import { useAccountUpgrade } from '../../../hooks/useAccountUpgrade';
import { useAuth } from '../../../contexts/AuthContext';

const ICPStoredMessages = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ messageCount: 0, userCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showTechnicalData, setShowTechnicalData] = useState(false);
  
  // Import upgrade hook for testing
  const { forceShowUpgrade, resetUpgradeState, messageCount, canUpgrade } = useAccountUpgrade();
  const { isGuestUser } = useAuth();

  useEffect(() => {
    initializeICP();
  }, []);

  const initializeICP = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test connection
      const connectionTest = await icpService.testConnection();
      if (connectionTest.success) {
        setConnectionStatus('connected');
        console.log('ICP Connection:', connectionTest.message);
        
        // Get stats
        const messageCountResult = await icpService.getMessageCount();
        const userCountResult = await icpService.getUserCount();
        
        setStats({
          messageCount: messageCountResult.success ? messageCountResult.count : 0,
          userCount: userCountResult.success ? userCountResult.count : 0
        });

        // Try to get user messages (this might fail if no user is authenticated)
        try {
          const messagesResult = await icpService.getUserMessages();
          if (messagesResult.success) {
            setMessages(messagesResult.messages || []);
          }
        } catch (err) {
          console.log('No user authenticated yet, that\'s okay');
        }

      } else {
        setConnectionStatus('error');
        setError(connectionTest.error);
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err.message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Test functions removed - only real conversations should be recorded

  const formatTimestamp = (timestamp) => {
    // Convert nanoseconds to milliseconds
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">ICP Chat Storage</h3>
        </div>
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' : 
          connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
        }`}></div>
        <h3 className="text-white font-semibold">ICP Chat Storage</h3>
        {lastUpdated && (
          <div className="text-white/50 text-xs ml-auto">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {connectionStatus === 'connected' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/70 text-sm">Total Messages</div>
              <div className="text-white font-semibold text-xl">{stats.messageCount}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/70 text-sm">Total Users</div>
              <div className="text-white font-semibold text-xl">{stats.userCount}</div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="flex gap-2">
            <button
              onClick={initializeICP}
              disabled={loading}
              className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            {/* Test buttons removed - only real conversations should be recorded */}
          </div>

          {/* Messages */}
          <div className="space-y-3">
            <div className="text-white/70 text-sm font-medium">Stored Messages:</div>
            {messages.length === 0 ? (
              <div className="text-white/50 text-sm bg-white/5 rounded-lg p-3">
                No messages found. Try creating a test user and message!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-white/70 text-xs">
                        {formatTimestamp(message.timestamp)}
                      </div>
                      <div className="text-white/50 text-xs">
                        {message.conversationId}
                      </div>
                    </div>
                    <div className="text-white text-sm">
                      <span className="text-blue-400">User:</span> {message.userMessage}
                    </div>
                    <div className="text-white text-sm">
                      <span className="text-green-400">AI:</span> {message.aiResponse}
                    </div>
                    <div className="flex gap-2 text-xs">
                      {message.metadata.searchEnabled && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Search</span>
                      )}
                      {message.metadata.imageEnabled && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Image</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {connectionStatus === 'error' && (
        <div className="text-red-400 text-sm">
          Connection Error: {error}
          <div className="mt-2 text-white/50 text-xs">
            Make sure your ICP local replica is running with `dfx start`
          </div>
        </div>
      )}

      {/* Technical Data Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={() => setShowTechnicalData(!showTechnicalData)}
          className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
        >
          {showTechnicalData ? 'Hide Technical Data' : 'Show Technical Data'}
        </button>
      </div>

      {/* Technical Data Panel */}
      {showTechnicalData && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-4">
          <div className="text-white font-semibold">ICP Chat Storage</div>
          <div className="text-white/70 text-sm">Updated: {lastUpdated?.toLocaleTimeString() || 'Never'}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-sm">Total Messages</div>
              <div className="text-white text-xl font-bold">{stats.messageCount}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70 text-sm">Total Users</div>
              <div className="text-white text-xl font-bold">{stats.userCount}</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={initializeICP}
              disabled={loading}
              className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            {/* Test buttons removed - only real conversations should be recorded */}
          </div>

          {/* All Stored Messages */}
          <div className="space-y-3">
            <div className="text-white/70 text-sm font-medium">All Stored Messages:</div>
            {messages.length === 0 ? (
              <div className="text-white/50 text-sm bg-white/5 rounded-lg p-3">
                No messages found. Messages will appear here as they're saved to ICP.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-3 space-y-2 border-l-2 border-blue-500/50">
                    <div className="flex justify-between items-start">
                      <div className="text-white/70 text-xs">
                        {formatTimestamp(message.timestamp)}
                      </div>
                      <div className="text-white/50 text-xs font-mono">
                        {message.conversationId}
                      </div>
                    </div>
                    <div className="text-white text-sm">
                      <span className="text-blue-400 font-semibold">User:</span> {message.userMessage}
                    </div>
                    <div className="text-white text-sm">
                      <span className="text-green-400 font-semibold">AI:</span> {message.aiResponse}
                    </div>
                    <div className="flex gap-2 text-xs">
                      {message.metadata.searchEnabled && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Search</span>
                      )}
                      {message.metadata.imageEnabled && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Image</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ICPStoredMessages; 