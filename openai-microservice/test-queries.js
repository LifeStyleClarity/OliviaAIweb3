import fetch from 'node-fetch';
import { config } from './src/config/config.js';

// Test configuration
const API_BASE_URL = `http://localhost:${config.port}`;
const EXTRACT_ENDPOINT = `${API_BASE_URL}/api/openai/extract-trading`;

// Test queries divided by categories
const testQueries = {
  // Valid crypto trading queries
  validCryptoQueries: [
    "I would like to buy TON by swapping USD to TON",
    "I want to buy 50 TON by swapping USD to TON", 
    "Sell 100 ETH for USDT",
    "Swap 0.5 BTC to ETH",
    "Trade my 1000 USDC for Bitcoin",
    "Buy Bitcoin with 500 dollars",
    "I need to exchange 200 USDT for Ethereum",
    "Convert 10 BTC to TON",
    "Purchase 1000 dollars worth of Solana",
    "I want to sell all my Dogecoin for USD",
    "Swap my Cardano for Polkadot",
    "Buy 25 TON using my USDC",
    "Exchange 500 EUR for Bitcoin",
    "I'd like to trade 0.1 ETH for TON tokens",
    "Sell 1000 TON for stable coins"
  ],
  
  // Non-crypto related queries
  nonCryptoQueries: [
    "What's the weather like today?",
    "How do I bake a chocolate cake?",
    "What time is it in New York?",
    "Tell me a joke about programming",
    "How to fix a leaky faucet?",
    "What's the capital of France?",
    "Recommend a good restaurant in Tokyo",
    "How to learn guitar?",
    "What's the latest news?",
    "Help me write an email to my boss",
    "What's the best way to exercise?",
    "How to grow tomatoes in a garden?",
    "Explain quantum physics simply",
    "What movies are playing this weekend?",
    "How to meditate properly?"
  ],

  // Ambiguous or edge case queries
  ambiguousQueries: [
    "I want to buy something",
    "Trade stuff",
    "Make money fast",
    "Invest in crypto",
    "Buy low sell high",
    "What's the best cryptocurrency?",
    "How much is Bitcoin worth?",
    "Should I buy Ethereum?",
    "Crypto portfolio advice",
    "Market analysis for TON",
    "Price prediction for BTC",
    "When to buy crypto?",
    "Hodl or sell?",
    "DeFi strategies",
    "NFT marketplace"
  ],

  // Incomplete or unclear trading queries
  incompleteQueries: [
    "Buy TON",
    "Sell Bitcoin",
    "I want crypto",
    "Trade now",
    "Exchange please",
    "Convert currency",
    "Get some coins",
    "Need tokens",
    "Swap assets",
    "Purchase digital money"
  ],

  // Multiple currency mentions (confusing cases)
  confusingQueries: [
    "I have BTC, ETH, and TON, what should I do?",
    "Buy BTC, sell ETH, hold TON",
    "Compare BTC vs ETH vs TON prices",
    "Portfolio with Bitcoin, Ethereum, and Toncoin",
    "Should I buy BTC or ETH or TON?",
    "My wallet has USDT, USDC, DAI, which is best?",
    "TON vs BTC vs ETH performance analysis",
    "Diversify between Bitcoin and altcoins",
    "Split investment between multiple coins",
    "Rebalance portfolio with various cryptos"
  ]
};

/**
 * Make API request to extract trading parameters
 */
async function testQuery(input) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Only add auth headers in production
    if (config.nodeEnv === 'production') {
      headers['Authorization'] = `Bearer ${config.adminAccessSecret}`;
      headers['Origin'] = config.allowedOrigin;
    }

    const response = await fetch(EXTRACT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input })
    });

    const data = await response.json();
    
    return {
      input,
      status: response.status,
      success: data.success,
      extractedParams: data.data?.extracted_parameters,
      error: data.error
    };
  } catch (error) {
    return {
      input,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

/**
 * Run tests for a category of queries
 */
async function runTestCategory(categoryName, queries) {
  console.log(`\n🧪 Testing ${categoryName}:`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const query of queries) {
    const result = await testQuery(query);
    results.push(result);
    
    // Display result
    console.log(`\n📝 Query: "${query}"`);
    console.log(`Status: ${result.status}`);
    
    if (result.success && result.extractedParams) {
      console.log(`✅ Extracted Parameters:`);
      console.log(`   From: ${result.extractedParams.from_currency || 'N/A'}`);
      console.log(`   To: ${result.extractedParams.to_currency || 'N/A'}`);
      console.log(`   Amount: ${result.extractedParams.amount || 'N/A'}`);
      console.log(`   Operation: ${result.extractedParams.operation_type || 'N/A'}`);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Generate summary report
 */
function generateSummary(allResults) {
  console.log('\n📊 TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  
  const categories = Object.keys(allResults);
  
  categories.forEach(category => {
    const results = allResults[category];
    const totalQueries = results.length;
    const successfulExtractions = results.filter(r => r.success && r.extractedParams).length;
    const errors = results.filter(r => !r.success).length;
    
    console.log(`\n${category}:`);
    console.log(`  Total Queries: ${totalQueries}`);
    console.log(`  Successful Extractions: ${successfulExtractions}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Success Rate: ${((successfulExtractions / totalQueries) * 100).toFixed(1)}%`);
  });
  
  // Expected behavior analysis
  console.log('\n📈 EXPECTED BEHAVIOR ANALYSIS:');
  console.log('-'.repeat(30));
  console.log('✅ Valid Crypto Queries: Should have HIGH success rate');
  console.log('❌ Non-Crypto Queries: Should have LOW success rate (expected)');
  console.log('⚠️  Ambiguous Queries: May have MIXED results');
  console.log('⚠️  Incomplete Queries: May have PARTIAL extraction');
  console.log('🤔 Confusing Queries: May need manual review');
}

/**
 * Test server health first
 */
async function testServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.success && data.status === 'healthy') {
      console.log('✅ Server is healthy and ready for testing');
      return true;
    } else {
      console.log('❌ Server health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Could not connect to server:', error.message);
    console.log('Make sure the server is running: npm run dev');
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Trading Parameter Extraction Tests');
  console.log('Server:', API_BASE_URL);
  console.log('='.repeat(60));
  
  // Test server health first
  const isHealthy = await testServerHealth();
  if (!isHealthy) {
    process.exit(1);
  }
  
  const allResults = {};
  
  // Run tests for each category
  for (const [categoryName, queries] of Object.entries(testQueries)) {
    allResults[categoryName] = await runTestCategory(categoryName, queries);
  }
  
  // Generate summary
  generateSummary(allResults);
  
  console.log('\n✨ Testing completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testQueries, testQuery, runAllTests };
