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
}

export const aiService = new AiService(); 