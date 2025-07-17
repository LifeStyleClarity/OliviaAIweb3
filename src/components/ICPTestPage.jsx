import { useState, useEffect } from 'react';
import icpService from '../api/services/icp.service';

const ICPTestPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ messageCount: 0, userCount: 0 });
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    addLog('Testing ICP connection...');
    try {
      const result = await icpService.testConnection();
      if (result.success) {
        setConnectionStatus('connected');
        addLog(`✅ Connection successful: ${result.message}`);
      } else {
        setConnectionStatus('error');
        addLog(`❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      addLog(`❌ Connection error: ${error.message}`);
    }
  };

  // Test user creation removed - only real conversations should be recorded

  const createGuestUser = async () => {
    addLog('Creating guest user...');
    try {
      const result = await icpService.createGuestUser();
      if (result.success) {
        setUser(result.user);
        addLog(`✅ Guest user created: ${result.user.id}`);
      } else {
        addLog(`❌ Guest user creation failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Guest user creation error: ${error.message}`);
    }
  };

  const saveTestMessage = async () => {
    if (!testMessage || !testResponse) {
      addLog('❌ Please enter both message and response');
      return;
    }

    addLog('Saving test message...');
    try {
      const messageId = `test_${Date.now()}`;
      const conversationId = `conv_${Date.now()}`;
      
      const result = await icpService.saveMessage(
        messageId,
        testMessage,
        testResponse,
        conversationId,
        true,
        false
      );
      
      if (result.success) {
        addLog(`✅ Message saved: ${result.message.id}`);
        setTestMessage('');
        setTestResponse('');
        await refreshData();
      } else {
        addLog(`❌ Message save failed: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ Message save error: ${error.message}`);
    }
  };

  const refreshData = async () => {
    try {
      // Get stats
      const messageCountResult = await icpService.getMessageCount();
      const userCountResult = await icpService.getUserCount();
      
      setStats({
        messageCount: messageCountResult.success ? messageCountResult.count : 0,
        userCount: userCountResult.success ? userCountResult.count : 0
      });

      // Get user messages
      const messagesResult = await icpService.getUserMessages();
      if (messagesResult.success) {
        setMessages(messagesResult.messages || []);
      }

      addLog('✅ Data refreshed');
    } catch (error) {
      addLog(`❌ Refresh error: ${error.message}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ICP Integration Test</h1>
        
        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <h3 className="font-semibold">Connection Status</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Test Connection
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Current Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-400">Messages</div>
              <div className="text-2xl font-bold">{stats.messageCount}</div>
            </div>
            <div>
              <div className="text-gray-400">Users</div>
              <div className="text-2xl font-bold">{stats.userCount}</div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">User Management</h3>
          <div className="flex gap-2 mb-4">
            {/* Test user button removed - only real conversations should be recorded */}
            <button
              onClick={createGuestUser}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Create Guest User
            </button>
          </div>
          {user && (
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-300">Current User:</div>
              <div className="font-mono text-xs">{user.id}</div>
              <div>{user.firstName} {user.lastName}</div>
            </div>
          )}
        </div>

        {/* Message Testing */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Test Message Save</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="User message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded"
            />
            <input
              type="text"
              placeholder="AI response"
              value={testResponse}
              onChange={(e) => setTestResponse(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded"
            />
            <button
              onClick={saveTestMessage}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Save Test Message
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Stored Messages</h3>
          {messages.length === 0 ? (
            <div className="text-gray-400">No messages found</div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="bg-gray-700 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(Number(message.timestamp) / 1000000).toLocaleString()}
                  </div>
                  <div className="text-sm mb-1">
                    <span className="text-blue-400">User:</span> {message.userMessage}
                  </div>
                  <div className="text-sm">
                    <span className="text-green-400">AI:</span> {message.aiResponse}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Debug Logs</h3>
          <div className="bg-black rounded p-3 h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-xs text-gray-300 mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICPTestPage; 