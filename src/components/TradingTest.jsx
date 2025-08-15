import React, { useState } from 'react';
import { okxDexService } from '../api/services/okx-dex.service.js';

const TradingTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSupportedChains = async () => {
    setLoading(true);
    try {
      const chains = await okxDexService.getSupportedChains();
      setResult({ type: 'chains', data: chains });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    }
    setLoading(false);
  };

  const testQuote = async () => {
    setLoading(true);
    try {
      const quote = await okxDexService.getOliviaQuote('USDT', 'USDC', 100);
      setResult({ type: 'quote', data: quote });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    }
    setLoading(false);
  };

  const testPopularPairs = async () => {
    setLoading(true);
    try {
      const pairs = await okxDexService.getPopularPairs();
      setResult({ type: 'pairs', data: pairs });
    } catch (error) {
      setResult({ type: 'error', data: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white">🔥 Olivia AI Trading Integration Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testSupportedChains}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Test Supported Chains
        </button>
        
        <button
          onClick={testQuote}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Test Quote (100 USDT → USDC)
        </button>
        
        <button
          onClick={testPopularPairs}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Test Popular Pairs
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"></div>
          <p className="text-gray-400 mt-2">Testing OKX API...</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">
            {result.type === 'error' ? '❌ Error' : '✅ Result'}
          </h3>
          <pre className="text-sm text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-900 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">💬 Try Trading Commands in Chat:</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <code className="bg-gray-700 px-2 py-1 rounded">"swap 100 USDT for USDC"</code></p>
          <p>• <code className="bg-gray-700 px-2 py-1 rounded">"price BONK to USDT"</code></p>
          <p>• <code className="bg-gray-700 px-2 py-1 rounded">"trade 0.5 ETH for DAI"</code></p>
          <p>• <code className="bg-gray-700 px-2 py-1 rounded">"quote 1000 SOL to USDC"</code></p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: These commands will be detected automatically when you chat with Olivia!
        </p>
      </div>
    </div>
  );
};

export default TradingTest;
