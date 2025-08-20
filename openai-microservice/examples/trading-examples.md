# Trading Parameter Extraction Examples

This document shows examples of how the `/api/openai/extract-trading` endpoint processes natural language trading requests.

## Example Inputs and Expected Outputs

### Example 1: Basic Buy Order
**Input:**
```
"I would like to buy TON by swapping USD to TON"
```

**Expected Output:**
```json
{
  "from_currency": "USD",
  "to_currency": "TON",
  "amount": null,
  "operation_type": "buy"
}
```

### Example 2: Buy with Amount
**Input:**
```
"I want to buy 50 TON by swapping USD to TON"
```

**Expected Output:**
```json
{
  "from_currency": "USD", 
  "to_currency": "TON",
  "amount": 50,
  "operation_type": "buy"
}
```

### Example 3: Sell Order
**Input:**
```
"I need to sell 100 ETH for USDT"
```

**Expected Output:**
```json
{
  "from_currency": "ETH",
  "to_currency": "USDT", 
  "amount": 100,
  "operation_type": "sell"
}
```

### Example 4: Swap Operation
**Input:**
```
"Swap 0.5 BTC to ETH"
```

**Expected Output:**
```json
{
  "from_currency": "BTC",
  "to_currency": "ETH",
  "amount": 0.5,
  "operation_type": "swap"
}
```

### Example 5: Complex Trade Request
**Input:**
```
"I want to trade my 1000 USDC for Bitcoin"
```

**Expected Output:**
```json
{
  "from_currency": "USDC",
  "to_currency": "BTC",
  "amount": 1000,
  "operation_type": "trade"
}
```

### Example 6: Fiat to Crypto
**Input:**
```
"Buy Bitcoin with 500 dollars"
```

**Expected Output:**
```json
{
  "from_currency": "USD",
  "to_currency": "BTC",
  "amount": 500,
  "operation_type": "buy"
}
```

## Testing with cURL

You can test these examples using cURL:

```bash
# Test Example 1 (Development - no auth needed)
curl -X POST http://localhost:3001/api/openai/extract-trading \
  -H "Content-Type: application/json" \
  -d '{
    "input": "I would like to buy TON by swapping USD to TON"
  }'

# Test Example 2 (Development - no auth needed)
curl -X POST http://localhost:3001/api/openai/extract-trading \
  -H "Content-Type: application/json" \
  -d '{
    "input": "I want to buy 50 TON by swapping USD to TON"
  }'

# For Production (with auth)
curl -X POST http://localhost:3001/api/openai/extract-trading \
  -H "Authorization: Bearer sk_176b98ce2b2e4245a98e218e9248b6ef0a80833b8f7b1" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "input": "I want to buy 50 TON by swapping USD to TON"
  }'
```

## Integration Notes

1. **Currency Normalization**: The extracted currencies may need normalization (e.g., "Bitcoin" → "BTC", "dollars" → "USD")
2. **Amount Validation**: Always validate that the amount is reasonable for the trading pair
3. **Error Handling**: Handle cases where extraction fails or returns unexpected results
4. **Rate Limiting**: Remember that the endpoint has rate limiting (10 requests per minute)

## Supported Operations

- `buy`: Purchasing an asset
- `sell`: Selling an asset  
- `swap`: Direct exchange between two assets
- `trade`: General trading operation

## Supported Currencies

The system can handle:
- Major cryptocurrencies (BTC, ETH, TON, etc.)
- Stablecoins (USDT, USDC, DAI, etc.)
- Fiat currencies (USD, EUR, etc.)
- Token symbols and full names
