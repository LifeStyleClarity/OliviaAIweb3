/**
 * @typedef {Object} ChatMessage
 * @property {string} role - The role of the message sender ('user' or 'assistant')
 * @property {string} content - The content of the message
 * @property {string} [steps] - Optional steps information
 * @property {Array} [sources] - Optional sources information
 * @property {string} created_at - Timestamp when the message was created
 * @property {string} message_id - Unique identifier for the message
 */

/**
 * @typedef {Object} UsageLog
 * @property {number} usage - Usage count
 * @property {string} usage_id - Unique identifier for the usage log
 * @property {string} created_at - Timestamp when the usage was logged
 * @property {number} [points_earned] - Points earned for this usage
 * @property {number} [points_earned_seasson_2] - Season 2 points earned for this usage
 */

/**
 * @typedef {Object} ChatHistoryData
 * @property {string} chat_id - Unique identifier for the chat
 * @property {string} created_at - Timestamp when the chat was created
 * @property {string} updated_at - Timestamp when the chat was last updated
 * @property {string} user_id - ID of the user this chat belongs to
 * @property {ChatMessage[]} chat_history - Array of chat messages
 * @property {Array} memories - Array of chat memories
 * @property {boolean} first_time_user - Whether this is a first-time user
 * @property {string} chat_summary - Summary of the chat
 * @property {number} usage - Total usage count
 * @property {number} points_earned - Total points earned
 * @property {number} points_earned_seasson_2 - Total season 2 points earned
 * @property {UsageLog[]} usage_log - Array of usage logs
 */

/**
 * @typedef {Object} ChatHistoryUpdateData
 * @property {ChatMessage[]} chat_history - Array of chat messages to update
 */

export {}; // Ensures this is treated as a module
