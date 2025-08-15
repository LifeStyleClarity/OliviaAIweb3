import { okxDexService } from './okx-dex.service.js';

/**
 * Enhanced AI Service for Olivia streaming chat system
 * Handles WebSocket connections, streaming responses, and user profile integration
 */
class AiService {
    constructor() {
        this.AGENT_ID = 'e66ea468-98a4-40a9-a9fd-803a39574e0e';
        this.MODEL_NAME = 'gpt-4.1';
        // Use environment variable for WebSocket URL, fallback to hardcoded for now
        const wsBase = import.meta.env.VITE_WEBSOCKET_URL || 'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app';
        
        // Try different WebSocket endpoints based on the API structure
        // Start with the known working endpoint first
        this.WS_ENDPOINTS = [
            'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream' // EXACT WebSocket endpoint for Olivia AI
        ];
        
        this.WS_URL = this.WS_ENDPOINTS[0]; // Start with the first endpoint (working one)
        this.currentEndpointIndex = 0;
        this.requestIdCounter = 0;
        this.pendingRequests = new Map();
    }

    /**
     * Generate a unique request ID for tracking WebSocket messages
     */
    generateRequestId() {
        return `req_${++this.requestIdCounter}_${Date.now()}`;
    }

    /**
     * Extract user profile options from user data
     */
    extractUserOptions(userData, loggedInUser, userChats = []) {
        const contactName = userData?.contact_name || loggedInUser?.contact_name || '';
        const [firstName = '', ...lastNameParts] = contactName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        return {
            type: 'olivia_ask',
            firstName: firstName,
            lastName: lastName,
            email: userData?.contact_email || loggedInUser?.contact_email || loggedInUser?.email || '',
            phoneNumber: userData?.contact_phone || loggedInUser?.contact_phone || '',
            companyName: userData?.company_name || loggedInUser?.company_name || '',
            userData: userData || null,
            loggedInUser: loggedInUser || null,
            userChats: userChats || []
        };
    }

    /**
     * Create WebSocket message for streaming chat
     */
    createStreamingMessage(text, conversationHistory, userOptions, requestId, searchEnabled = false, imageEnabled = false) {
        return {
            type: 'text',
            requestId,
            data: {
                model: this.MODEL_NAME,
                text,
                messages: conversationHistory,
                options: {
                    agentId: this.AGENT_ID,
                    search_available: searchEnabled,
                    image_available: imageEnabled,
                    ...userOptions
                }
            }
        };
    }

    /**
     * Process conversation history for WebSocket (excluding system and explanation messages)
     */
    processConversationHistory(messages) {
        return messages
            .filter(msg => msg.role !== 'system')
            .filter(msg => !msg.isExplanation)
            .map(msg => ({ role: msg.role, content: msg.content }));
    }

    /**
     * Handle different WebSocket message types
     */
    handleWebSocketMessage(data, callbacks) {
        const { 
            onStreamChunk, 
            onStreamComplete, 
            onExplanationChunk, 
            onExplanationComplete, 
            onEvent,
            onError 
        } = callbacks;

        try {
            switch (data.type) {
                case 'stream_chunk':
                    onStreamChunk?.(data);
                    break;
                
                case 'stream_complete':
                    onStreamComplete?.(data);
                    break;
                
                case 'explanation_chunk':
                    onExplanationChunk?.(data);
                    break;
                
                case 'explanation_complete':
                    onExplanationComplete?.(data);
                    break;
                
                case 'event':
                    onEvent?.(data);
                    break;
                
                default:
                    console.log('Unknown message type:', data.type, 'Full data:', data);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            onError?.(error);
        }
    }

    /**
     * Process streaming chunk data
     */
    processStreamChunk(data) {
        const { requestId, data: chunkData } = data;
        const text = chunkData.text || '';
        
        return {
            requestId,
            text,
            isFirstChunk: !this.pendingRequests.has(requestId)
        };
    }

    /**
     * Process stream completion data
     */
    processStreamComplete(data) {
        const { requestId, data: completeData } = data;
        
        // Clean up pending request
        if (requestId) {
            this.pendingRequests.delete(requestId);
        }
        
        // Check if sources should be included
        const shouldIncludeSources = completeData?.urlSources?.type === 'web_search' 
            && completeData?.urlSources?.annotations;
        
        return {
            requestId,
            fullResponse: completeData?.fullResponse,
            sources: shouldIncludeSources ? completeData.urlSources.annotations : null,
            isComplete: true
        };
    }

    /**
     * Process explanation chunk data
     */
    processExplanationChunk(data) {
        const { data: chunkData } = data;
        const text = chunkData.text || '';
        
        return {
            text,
            isExplanation: true
        };
    }

    /**
     * Process explanation completion data
     */
    processExplanationComplete(data) {
        const { data: explanationData } = data;
        
        return {
            fullResponse: explanationData?.fullResponse,
            isExplanation: true,
            completed: true
        };
    }

    /**
     * Process event data for action tracking
     */
    processEvent(data) {
        const { eventType, data: eventData } = data;
        
        let actionType = null;
        let status = null;
        
        switch (eventType) {
            case 'action_start':
                if (eventData?.action === 'web_search') {
                    actionType = 'web_search';
                    status = 'in_progress';
                }
                break;
            
            case 'action_complete':
                if (eventData?.status === 'completed') {
                    actionType = null;
                    status = 'completed';
                }
                break;
        }
        
        return {
            eventType,
            actionType,
            status,
            eventData
        };
    }

    /**
     * Add a pending request for tracking
     */
    addPendingRequest(requestId, content) {
        this.pendingRequests.set(requestId, { 
            content, 
            timestamp: Date.now() 
        });
    }

    /**
     * Get WebSocket URL with fallback options
     */
    getWebSocketUrl() {
        return this.WS_URL;
    }

    /**
     * Try next WebSocket endpoint in case of connection failure
     */
    tryNextEndpoint() {
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.WS_ENDPOINTS.length;
        this.WS_URL = this.WS_ENDPOINTS[this.currentEndpointIndex];
        console.log(`Trying next WebSocket endpoint: ${this.WS_URL}`);
        return this.WS_URL;
    }

    /**
     * Reset to first endpoint
     */
    resetToFirstEndpoint() {
        this.currentEndpointIndex = 0;
        this.WS_URL = this.WS_ENDPOINTS[0];
        return this.WS_URL;
    }

    /**
     * Get all available endpoints for testing
     */
    getAllEndpoints() {
        return this.WS_ENDPOINTS;
    }

    /**
     * Check if a request is pending
     */
    isPendingRequest(requestId) {
        return this.pendingRequests.has(requestId);
    }

    /**
     * Clear all pending requests
     */
    clearPendingRequests() {
        this.pendingRequests.clear();
    }

    /**
     * Analyze message for privacy/sensitivity using AI
     * @param {string} message - The message to analyze
     * @returns {Promise<Object>} Privacy analysis result
     */
    async analyzePrivacy(message) {
        const analysisPrompt = `Analyze this message for sensitive or personal information. Look for:
- Personal identifiers (names, emails, phone numbers, addresses)
- Financial information (credit cards, bank details, SSN)
- Medical information
- Private conversations that shouldn't be stored publicly
- Any other information that should remain private

Message to analyze: "${message}"

Respond with JSON only:
{
  "isSensitive": boolean,
  "confidence": number (0-1),
  "reasons": ["reason1", "reason2"],
  "recommendation": "hash" or "store_plaintext"
}`;

        try {
            // Create a WebSocket connection for privacy analysis
            return new Promise((resolve, reject) => {
                const ws = new WebSocket(this.WS_URL);
                const requestId = this.generateRequestId();
                
                const messageData = {
                    type: 'text',
                    requestId,
                    data: {
                        model: 'gpt-4',
                        text: analysisPrompt,
                        messages: [],
                        options: {
                            agentId: this.AGENT_ID,
                            search_available: false,
                            image_available: false,
                            max_tokens: 200,
                            temperature: 0.1
                        }
                    }
                };

                let fullResponse = '';
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error('Privacy analysis timeout'));
                }, 10000);

                ws.onopen = () => {
                    ws.send(JSON.stringify(messageData));
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'stream_chunk' && data.requestId === requestId) {
                            fullResponse += data.data?.text || '';
                        } else if (data.type === 'stream_complete' && data.requestId === requestId) {
                            clearTimeout(timeout);
                            ws.close();
                            
                            try {
                                // Try to parse the JSON response
                                const result = JSON.parse(fullResponse);
                                resolve({
                                    success: true,
                                    isSensitive: result.isSensitive,
                                    confidence: result.confidence,
                                    reasons: result.reasons || [],
                                    recommendation: result.recommendation
                                });
                            } catch (parseError) {
                                // Fallback if JSON parsing fails
                                resolve({
                                    success: false,
                                    error: 'Failed to parse AI response',
                                    rawResponse: fullResponse
                                });
                            }
                        }
                    } catch (error) {
                        clearTimeout(timeout);
                        ws.close();
                        reject(error);
                    }
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(new Error('WebSocket connection failed'));
                };
            });

        } catch (error) {
            console.error('Privacy analysis failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a mock AI response for testing
     */
    createMockResponse(message, includeActions = false) {
        const actions = includeActions ? [
            {
                type: 'token_info',
                data: {
                    symbol: 'TON',
                    price: '$5.42',
                    change: '+2.5%'
                }
            }
        ] : [];

        return {
            type: 'chat_response',
            message: {
                id: Date.now().toString(),
                text: `This is a mock response to: "${message}". The WebSocket service is currently unavailable, but the chat interface is working! You can test all the UI features.`,
                sender: 'assistant',
                timestamp: new Date().toISOString(),
                actions: actions,
                sources: [
                    {
                        title: 'Mock Source',
                        url: 'https://example.com',
                        description: 'This is a mock source for testing'
                    }
                ]
            }
        };
    }

    /**
     * Check if message contains trading request and handle it
     */
    async handleTradingRequest(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for trading keywords
        const tradingKeywords = ['swap', 'trade', 'exchange', 'convert', 'buy', 'sell'];
        const hasTradingKeyword = tradingKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (!hasTradingKeyword) {
            return null;
        }

        console.log('🔍 Trading keyword detected in message:', message);

        // Extract tokens and amounts using a more flexible approach
        const tokenPattern = /\b([A-Za-z]{2,10})\b/g; // Match 2-10 letters (token symbols, case insensitive)
        const amountPattern = /\b(\d+(?:\.\d+)?)\b/g; // Match numbers
        
        const allTokenMatches = [...message.matchAll(tokenPattern)].map(match => match[1].toUpperCase());
        const amounts = [...message.matchAll(amountPattern)].map(match => parseFloat(match[1]));
        
        // Filter to only common crypto tokens (to avoid matching random words)
        const commonTokens = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'BNB', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE', 'COMP', 'MKR', 'SNX', 'CRV', 'YFI', 'SUSHI', 'BAL', 'BONK', 'PEPE', 'SHIB', 'DOGE', 'LTC', 'BCH', 'XRP', 'TRX', 'TON', 'NEAR', 'ATOM', 'FTM', 'ALGO', 'XLM', 'VET', 'ICP', 'FLOW', 'SAND', 'MANA', 'AXS', 'ENJ', 'CHZ', 'BAT', 'ZRX', 'REP', 'KNC', 'LRC', 'REN', 'BNT', 'MLN', 'NMR', 'ANT', 'STORJ', 'GNT', 'OMG', 'ZIL', 'ICX', 'QTUM', 'LSK', 'STEEM', 'EOS', 'NEO', 'GAS', 'ONT', 'VEN', 'WTC', 'POWR', 'REQ', 'MOD', 'EVX', 'CTR', 'SALT', 'SUB', 'MYST', 'ADX', 'CND', 'DLT', 'QSP', 'RCN', 'TNB', 'VIB', 'POWR', 'REQ', 'MOD', 'EVX', 'CTR', 'SALT', 'SUB', 'MYST', 'ADX', 'CND', 'DLT', 'QSP', 'RCN', 'TNB', 'VIB'];
        const tokens = allTokenMatches.filter(token => commonTokens.includes(token));
        
        console.log('🔍 Extracted tokens:', tokens, 'amounts:', amounts);

        if (tokens.length >= 2) {
            // We have at least 2 tokens, assume first is FROM, second is TO
            const fromToken = tokens[0];
            const toToken = tokens[1];
            const amount = amounts.length > 0 ? amounts[0] : 1; // Default to 1 if no amount specified
            
            return await this.processTradingRequest([null, amount, fromToken, toToken], message);
        } else if (tokens.length === 1 && lowerMessage.includes('price')) {
            // Price check for single token
            return {
                success: false,
                oliviaMessage: `You want the price of ${tokens[0]}? I need to know what you want to compare it to! Like "what's the price of ${tokens[0]} in USDT?" 🤔`
            };
        }

        // If we detected trading keywords but couldn't parse tokens
        return {
            success: false,
            oliviaMessage: "I can tell you want to do some trading, but I'm not sure what tokens you're talking about. Try something like 'swap 100 USDT for SOL' or 'what's the price of BONK in USDT?' 😏"
        };
    }

    /**
     * Process detected trading request
     */
    async processTradingRequest(match, originalMessage) {
        try {
            console.log('🤖 Olivia: Processing trading request', { match, originalMessage });

            // Extract trading parameters
            let amount, fromToken, toToken;
            
            if (match.length >= 4) {
                // Full swap request: "swap 100 USDT for SOL"
                [, amount, fromToken, toToken] = match;
                amount = parseFloat(amount);
            } else if (match.length === 3) {
                // Simple price check: "price BONK to USDT"
                [, fromToken, toToken] = match;
                amount = 1; // Default to 1 for price check
            }

            if (!fromToken || !toToken) {
                return {
                    success: false,
                    oliviaMessage: "I need to know what tokens you want to trade! Try something like 'swap 100 USDT for SOL' or 'price BONK to USDT'. 🤔"
                };
            }

            // Get quote from OKX DEX
            const quoteResult = await okxDexService.getOliviaQuote(fromToken, toToken, amount);
            
            if (quoteResult.success) {
                return {
                    success: true,
                    type: 'trading_quote',
                    oliviaMessage: quoteResult.oliviaMessage,
                    tradingData: {
                        fromToken: fromToken.toUpperCase(),
                        toToken: toToken.toUpperCase(),
                        fromAmount: amount,
                        toAmount: quoteResult.details.toAmount,
                        rate: quoteResult.details.rate,
                        gasEstimate: quoteResult.details.gasEstimate,
                        quote: quoteResult.quote
                    }
                };
            } else {
                return {
                    success: false,
                    oliviaMessage: quoteResult.oliviaMessage,
                    error: quoteResult.error
                };
            }
        } catch (error) {
            console.error('🤖 Olivia: Trading request error:', error);
            return {
                success: false,
                oliviaMessage: "Something went haywire with that trading request. My circuits are a bit fried - try again? 🤖💥",
                error: error.message
            };
        }
    }

    /**
     * Get supported trading pairs
     */
    async getSupportedTradingPairs() {
        try {
            const chains = await okxDexService.getSupportedChains();
            return {
                success: true,
                chains: chains.chains,
                oliviaMessage: "I can trade across 20+ chains and 500+ DEXs! Popular ones include Ethereum, Solana, BSC, and more. What tokens are you thinking about? 😏"
            };
        } catch (error) {
            return {
                success: false,
                oliviaMessage: "Can't fetch the trading pairs right now - the DEX gods are being difficult. Try again later? 🙄",
                error: error.message
            };
        }
    }
}

export const aiService = new AiService(); 