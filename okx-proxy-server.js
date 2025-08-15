import express from 'express';
import cors from 'cors';
import CryptoJS from 'crypto-js';
import axios from 'axios';

const app = express();
const PORT = 3001;

// OKX API Configuration
const API_KEY = '01cf4db1-160f-4baf-aa33-ca92ee7d1e01';
const SECRET_KEY = 'B326A560DF0D8AA0AE8AAE7A42082676';
const PASSPHRASE = 'Olivia2025!';
const OKX_BASE_URL = 'https://www.okx.com/api/v5/dex/aggregator';

app.use(cors());
app.use(express.json());

// Generate OKX authentication signature
function generateSignature(timestamp, method, requestPath, body = '') {
  const message = timestamp + method.toUpperCase() + requestPath + body;
  return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, SECRET_KEY));
}

// Create authenticated headers
function createHeaders(method, requestPath, body = '') {
  const timestamp = new Date().toISOString();
  const signature = generateSignature(timestamp, method, requestPath, body);

  return {
    'OK-ACCESS-KEY': API_KEY,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': PASSPHRASE,
    'Content-Type': 'application/json'
  };
}

// Proxy endpoint for OKX quote
app.get('/okx/quote', async (req, res) => {
  try {
    const { chainId, fromToken, toToken, amount, slippage = '0.5' } = req.query;
    
    // Token address mapping (simplified - you'd want a more complete mapping)
    const tokenAddresses = {
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86a33E6441d41Bce2C2c8d6c4e7c14e8c2b8',
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    };

    const fromTokenAddress = tokenAddresses[fromToken.toUpperCase()];
    const toTokenAddress = tokenAddresses[toToken.toUpperCase()];

    if (!fromTokenAddress || !toTokenAddress) {
      return res.status(400).json({
        error: 'Unsupported token',
        message: `Supported tokens: ${Object.keys(tokenAddresses).join(', ')}`
      });
    }

    // Format amount (assuming 18 decimals)
    const formattedAmount = (parseFloat(amount) * Math.pow(10, 18)).toString();

    const requestPath = `/quote?chainId=${chainId || '1'}&fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${formattedAmount}&slippage=${slippage}`;
    const headers = createHeaders('GET', requestPath);

    const response = await axios.get(`${OKX_BASE_URL}${requestPath}`, { headers });

    // Format response for Olivia
    const quote = response.data.data;
    const outputAmount = (parseFloat(quote.toTokenAmount) / Math.pow(10, 18)).toFixed(6);
    const rate = (parseFloat(outputAmount) / parseFloat(amount)).toFixed(6);

    res.json({
      success: true,
      fromToken: fromToken.toUpperCase(),
      toToken: toToken.toUpperCase(),
      fromAmount: amount,
      toAmount: outputAmount,
      rate: rate,
      gasEstimate: quote.estimatedGas,
      oliviaMessage: `Sweet! I found you a deal: ${amount} ${fromToken.toUpperCase()} gets you ${outputAmount} ${toToken.toUpperCase()} - that's a rate of ${rate}. Gas estimate: ${quote.estimatedGas}. Want me to help you execute this? 😏`
    });

  } catch (error) {
    console.error('OKX Proxy Error:', error.response?.data || error.message);
    
    // Handle geo-blocking specifically
    if (error.response?.data?.msg?.includes('local regulations')) {
      res.json({
        success: false,
        error: 'geo_blocked',
        oliviaMessage: "Ugh, looks like OKX is geo-blocked in your area. Those pesky regulations are cramping my style! 🙄 I need to set up a different DEX aggregator for your region. Give me a sec to work on that... 🔧"
      });
    } else {
      res.json({
        success: false,
        error: error.response?.data?.msg || error.message,
        oliviaMessage: "Something went haywire getting that quote. The DEX gods aren't cooperating right now. Try again in a sec? 🙄"
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'OKX Proxy Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 OKX Proxy Server running on http://localhost:${PORT}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
  console.log(`💱 Quote endpoint: http://localhost:${PORT}/okx/quote`);
});
