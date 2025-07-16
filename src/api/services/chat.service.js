import { ENDPOINTS } from '../config/endpoints.js';
import { v4 as uuidv4 } from 'uuid';
import axiosInstanceAPIGateway from '../config/axios-gateway.js';

/**
 * Chat service for handling WebSocket connections
 */
class ChatService {
    /**
     * Get the WebSocket URL for chat
     * @param {boolean} isAgentChat - Whether this is an agent chat
     * @returns {string} WebSocket URL
     */
    getChatWebSocketUrl(isAgentChat = false) {
        return isAgentChat ? ENDPOINTS.WEBSOCKET.AGENT_CHAT : ENDPOINTS.WEBSOCKET.CHAT;
    }

    /**
     * Get the WebSocket URL for audio chat
     * @returns {string} WebSocket URL
     */
    getAudioWebSocketUrl() {
        return ENDPOINTS.WEBSOCKET.AUDIO;
    }

    /**
     * Format messages for WebSocket communication
     * @param {Array} messages - Array of messages to format
     * @returns {Array} Formatted messages
     */
    formatMessages(messages) {
        return messages.map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text || "",
            type: "olivia_chat",
            created_at: new Date().toISOString(),
            message_id: uuidv4()
        }));
    }

    /**
     * Format a single message
     * @param {string} content - Message content
     * @param {string} role - Message role (user/assistant)
     * @returns {Object} Formatted message
     */
    formatMessage(content, role = "user") {
        return {
            role,
            content,
            type: "olivia_chat",
            created_at: new Date().toISOString(),
            message_id: uuidv4()
        };
    }

    /**
     * Create message data for text chat
     * @param {string} text - Message text
     * @param {Array} previousMessages - Previous messages
     * @param {Object} agent - Optional agent information
     * @param {string} userId - User ID from AuthContext (required)
     * @returns {Object} Formatted message data
     */
    createMessageData(text, previousMessages = [], agent = null, userId) {
        const formattedMessages = this.formatMessages([
            ...previousMessages,
            { text, sender: 'user' }
        ]);

        return {
            user_id: userId,
            user_input: text,
            trade_style: "Manual",
            messages: formattedMessages,
            ...(agent && {
                agent_name: agent.name,
                agent_id: agent.id,
            }),
        };
    }

    /**
     * Create message data for audio chat
     * @param {Blob} audioBlob - Audio data
     * @param {string} trade_style - Trading style
     * @param {string} userId - User ID from AuthContext (required)
     * @returns {Object} Formatted audio message data
     */
    async createAudioMessageData(audioBlob, trade_style = "Manual", userId) {
        // Convert audio blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        return {
            metadata: {
                user_id: userId,
                trade_style: trade_style,
                file_type: "audio/wav"
            },
            audio: base64Audio,
            messages: [this.formatMessage("Audio input", "user")]
        };
    }

    /**
     * Parse bot message content from response
     * @param {Object} response - Response from the bot
     * @returns {Object|null} Parsed message content
     */
    parseBotMessageContent(response) {
        if (!response) return null;

        switch (response.action_type) {
            case "conversation_going":
                return {
                    text: response.final_answer,
                    action_type: "conversation",
                };
            case "action": {
                // Check if final_answer is a string
                if (typeof response.final_answer === "string") {
                    return {
                        text: response.final_answer,
                        action_type: "conversation", // Using conversation type for string messages
                    };
                }
                
                // Existing logic for when final_answer is an object
                let messageData = {
                    text: response.final_answer.message,
                    action_type: response?.action_type,
                    sub_action_type: response.final_answer.action,
                    meta: response.final_answer.action === "show_portfolio"
                        ? response.final_answer.data
                        : response.final_answer.meta,
                };

                if (
                    response.final_answer.action === "swap" ||
                    response.final_answer.action === "found_multiple_ca"
                ) {
                    messageData.amount = response.final_answer.amount;
                    messageData.swap_type = response.final_answer.swap_type;
                    messageData.contract_address = response.final_answer.contract_address;
                }

                return messageData;
            }
            default:
                return {
                    text: response.final_answer,
                    action_type: "unknown",
                };
        }
    }

    /**
     * Parse audio response from the bot
     * @param {Object} response - Response from the bot
     * @returns {Object} Parsed audio response
     */
    async parseAudioResponse(response) {
        if (response?.audio) {
            // Convert base64 to binary and then to a Blob
            const audioData = response.audio;
            const binaryData = atob(audioData);
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryData.length; i++) {
                uint8Array[i] = binaryData.charCodeAt(i);
            }
            const audioBlob = new Blob([arrayBuffer], { type: "audio/mp3" });

            const messageData = {
                type: "audio",
                data: audioBlob,
                text: typeof response?.final_answer === "string" 
                    ? response?.final_answer 
                    : response?.final_answer?.message || response?.final_answer,
                meta: response?.final_answer?.meta || null,
                action_type: response?.action_type,
                sub_action_type: response?.final_answer?.action || null
            };

            // Add swap-specific data if it's a swap action
            if (typeof response?.final_answer === "object" && response?.final_answer?.action === "swap") {
                messageData.amount = response.final_answer.amount;
                messageData.swap_type = response.final_answer.swap_type;
                messageData.contract_address = response.final_answer.contract_address;
            }

            return messageData;
        }
        return null;
    }

    /**
     * Get chat history for a user
     * @param {string} userId - The user ID to fetch chat history for
     * @returns {Promise<import('../types/chat.types').ChatHistoryData>} Chat history data
     */
    async getChatHistory(userId) {
        if (!userId || userId === 'guest_user') return null;
        
        try {
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.CHAT.GET_CHAT_HISTORY.replace(':id', userId)
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error fetching chat history:', error);
            // Return null instead of throwing to prevent app crashes
            return null;
        }
    }

    /**
     * Update chat history for a user
     * @param {string} userId - The user ID to update chat history for
     * @param {import('../types/chat.types').ChatHistoryUpdateData} chatData - The chat data to update
     * @returns {Promise<import('../types/chat.types').ChatHistoryData>} Updated chat history data
     */
    async updateChatHistory(userId, chatData) {
        if (!userId || userId === 'guest_user') return null;
        
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.CHAT.UPDATE_CHAT_HISTORY.replace(':id', userId),
                chatData
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error updating chat history:', error);
            // Return null instead of throwing to prevent app crashes
            return null;
        }
    }
}

// Export a singleton instance
export const chatService = new ChatService();
