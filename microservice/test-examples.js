import { testQuery } from './test-queries.js';

/**
 * Simple manual test runner for individual queries
 */
async function runIndividualTests() {
  console.log('🧪 Running Individual Test Examples\n');

  const examples = [
    // Crypto trading examples
    "I would like to buy TON by swapping USD to TON",
    "I want to buy 50 TON by swapping USD to TON", 
    "Sell 100 ETH for USDT",
    "Swap 0.5 BTC to ETH",
    
    // Non-crypto examples
    "What's the weather like today?",
    "How do I bake a chocolate cake?",
    
    // Ambiguous examples
    "I want to buy something",
    "Buy TON",
  ];

  for (const example of examples) {
    console.log(`\n📝 Testing: "${example}"`);
    console.log('─'.repeat(50));
    
    const result = await testQuery(example);
    
    if (result.success && result.extractedParams) {
      console.log('✅ SUCCESS - Extracted Parameters:');
      console.log(`   From Currency: ${result.extractedParams.from_currency || 'Not specified'}`);
      console.log(`   To Currency: ${result.extractedParams.to_currency || 'Not specified'}`);
      console.log(`   Amount: ${result.extractedParams.amount || 'Not specified'}`);
      console.log(`   Operation: ${result.extractedParams.operation_type || 'Not specified'}`);
    } else {
      console.log('❌ FAILED or NO EXTRACTION:');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      console.log(`   Status: ${result.status}`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n✨ Individual tests completed!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIndividualTests().catch(console.error);
}
