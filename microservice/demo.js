import { testQuery } from './test-queries.js';

/**
 * Interactive demo showcasing the trading parameter extraction
 */
async function runDemo() {
  console.log('🚀 OpenAI Trading Parameter Extraction Demo');
  console.log('='.repeat(50));
  console.log('This demo shows how natural language trading requests');
  console.log('are converted into structured parameters using OpenAI function calling.\n');

  const demoQueries = [
    {
      title: "🟢 Basic Buy Order",
      query: "I would like to buy TON by swapping USD to TON",
      expected: "Should extract: USD → TON, operation: buy"
    },
    {
      title: "🔵 Buy with Amount",
      query: "I want to buy 50 TON by swapping USD to TON", 
      expected: "Should extract: USD → TON, amount: 50, operation: buy"
    },
    {
      title: "🟡 Sell Order",
      query: "Sell 100 ETH for USDT",
      expected: "Should extract: ETH → USDT, amount: 100, operation: sell"
    },
    {
      title: "🟠 Swap Operation",
      query: "Swap 0.5 BTC to ETH",
      expected: "Should extract: BTC → ETH, amount: 0.5, operation: swap"
    },
    {
      title: "🔴 Non-Trading Query (Should Fail)",
      query: "What's the weather like today?",
      expected: "Should NOT extract trading parameters (expected failure)"
    }
  ];

  for (const demo of demoQueries) {
    console.log(`\n${demo.title}`);
    console.log('─'.repeat(demo.title.length));
    console.log(`Query: "${demo.query}"`);
    console.log(`Expected: ${demo.expected}`);
    console.log('\nProcessing...');
    
    const result = await testQuery(demo.query);
    
    if (result.success && result.extractedParams) {
      console.log('✅ SUCCESS - Extracted Parameters:');
      console.log(`   📤 From: ${result.extractedParams.from_currency || 'Not specified'}`);
      console.log(`   📥 To: ${result.extractedParams.to_currency || 'Not specified'}`);
      console.log(`   💰 Amount: ${result.extractedParams.amount || 'Not specified'}`);
      console.log(`   ⚡ Operation: ${result.extractedParams.operation_type || 'Not specified'}`);
    } else {
      console.log('❌ FAILED or NO EXTRACTION:');
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      console.log(`   Status: ${result.status}`);
    }
    
    // Delay for dramatic effect and rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Demo completed!');
  console.log('\n💡 Key Takeaways:');
  console.log('• The system successfully extracts structured data from natural language');
  console.log('• Trading queries return parsed parameters (from, to, amount, operation)');
  console.log('• Non-trading queries correctly fail to extract parameters');
  console.log('• The extracted data can be used to execute actual trades');
  console.log('\n🔧 Next Steps:');
  console.log('• Integrate with your trading API');
  console.log('• Add validation for currency pairs');
  console.log('• Implement amount validation and limits');
  console.log('• Add confirmation flows for user safety');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}
