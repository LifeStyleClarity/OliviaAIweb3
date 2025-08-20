import CryptoJS from 'crypto-js';
import { aiService } from './ai.service.js';
import { log, error as logError, warn } from '../../utils/logger.js';

/**
 * Privacy Service - Detects sensitive information and handles message hashing
 */
class PrivacyService {
    constructor() {
        // Sensitivity patterns for local detection (backup)
        this.sensitivePatterns = [
            // Email addresses
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            // Phone numbers (various formats)
            /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
            // Social Security Numbers
            /\b\d{3}-?\d{2}-?\d{4}\b/g,
            // Credit card numbers (basic pattern)
            /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
            // Addresses (street numbers + street names)
            /\b\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)\b/gi,
            // Bank account patterns
            /\b(?:account|routing)\s*(?:number|#)?\s*:?\s*\d{6,17}\b/gi,
        ];

        // Personal info keywords that might indicate sensitive content
        this.sensitiveKeywords = [
            'password', 'ssn', 'social security', 'bank account', 'routing number',
            'credit card', 'debit card', 'pin number', 'security code', 'cvv',
            'mother\'s maiden name', 'date of birth', 'dob', 'drivers license',
            'passport number', 'medical record', 'diagnosis', 'prescription'
        ];
    }

    /**
     * Analyze message for sensitive information using local patterns (fast & reliable)
     * @param {string} message - The message to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeMessageSensitivity(message) {
        try {
            // Use fast local pattern matching for now (AI analysis was timing out)
            const localCheck = this.performLocalSensitivityCheck(message);
            
            const result = {
                isSensitive: localCheck.isSensitive,
                confidence: localCheck.confidence,
                reasons: localCheck.reasons,
                method: 'local_pattern_matching'
            };

            log('🔒 Privacy analysis result:', {
                message: message ? message.substring(0, 50) + '...' : 'undefined',
                isSensitive: result.isSensitive,
                confidence: result.confidence,
                reasons: result.reasons,
                method: result.method
            });

            return result;

        } catch (error) {
            logError('🔒 Privacy analysis failed:', error);
            // Return safe default - treat as non-sensitive if analysis fails
            return {
                isSensitive: false,
                confidence: 0,
                reasons: [],
                method: 'error_fallback',
                error: error.message
            };
        }
    }

    /**
     * Perform local pattern-based sensitivity check
     * @param {string} message - The message to check
     * @returns {Object} Local check result
     */
    performLocalSensitivityCheck(message) {
        // Handle undefined or null messages
        if (!message || typeof message !== 'string') {
            warn('🔒 Privacy check received invalid message:', message);
            return {
                isSensitive: false,
                confidence: 0,
                reasons: []
            };
        }

        const reasons = [];
        let maxConfidence = 0;

        // Check for regex patterns
        for (const pattern of this.sensitivePatterns) {
            const matches = message.match(pattern);
            if (matches) {
                reasons.push(`Contains potential ${this.getPatternType(pattern)}: ${matches[0].substring(0, 10)}...`);
                maxConfidence = Math.max(maxConfidence, 0.9);
            }
        }

        // Check for sensitive keywords
        const lowerMessage = message.toLowerCase();
        for (const keyword of this.sensitiveKeywords) {
            if (lowerMessage.includes(keyword)) {
                reasons.push(`Contains sensitive keyword: ${keyword}`);
                maxConfidence = Math.max(maxConfidence, 0.6);
            }
        }

        return {
            isSensitive: reasons.length > 0,
            confidence: maxConfidence,
            reasons: reasons
        };
    }

    /**
     * Perform AI-based sensitivity analysis
     * @param {string} message - The message to analyze
     * @returns {Promise<Object>} AI analysis result
     */
    async performAISensitivityCheck(message) {
        try {
            // Use the existing AI service for privacy analysis
            const result = await aiService.analyzePrivacy(message);
            
            if (result.success) {
                return {
                    success: true,
                    isSensitive: result.isSensitive,
                    confidence: result.confidence,
                    reasons: result.reasons || [],
                    recommendation: result.recommendation
                };
            }

            return { success: false, error: result.error || 'AI analysis failed' };

        } catch (error) {
            logError('🔒 AI privacy analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Hash a message for privacy protection
     * @param {string} message - The message to hash
     * @param {string} userSalt - Optional user-specific salt
     * @returns {Object} Hashed message data
     */
    hashMessage(message, userSalt = '') {
        try {
            // Create a unique salt for this message
            const messageSalt = CryptoJS.lib.WordArray.random(128/8).toString();
            const combinedSalt = userSalt + messageSalt;
            
            // Hash the message
            const hashedMessage = CryptoJS.SHA256(message + combinedSalt).toString();
            
            // Create a shorter hash for display/search purposes
            const shortHash = hashedMessage.substring(0, 16);
            
            // Store metadata about the original message (without revealing content)
            const metadata = {
                originalLength: message.length,
                wordCount: message.split(' ').length,
                hashedAt: new Date().toISOString(),
                shortHash: shortHash,
                salt: messageSalt // Store salt to potentially verify later
            };

            log('🔒 Message hashed for privacy:', {
                originalLength: message.length,
                hashedLength: hashedMessage.length,
                shortHash: shortHash
            });

            return {
                success: true,
                hashedMessage: hashedMessage,
                shortHash: shortHash,
                metadata: metadata,
                displayText: `[Private message - ${shortHash}]`
            };

        } catch (error) {
            logError('🔒 Message hashing failed:', error);
            return {
                success: false,
                error: error.message,
                originalMessage: message // Fallback to original if hashing fails
            };
        }
    }

    /**
     * Process message through privacy filter
     * @param {string} userMessage - User's message
     * @param {string} aiResponse - AI's response
     * @param {string} userId - User ID for salt generation
     * @returns {Promise<Object>} Processed messages
     */
    async processMessages(userMessage, aiResponse, userId = '') {
        try {
            log('🔒 Processing messages through privacy filter...');

            // Analyze both user message and AI response
            const [userAnalysis, aiAnalysis] = await Promise.all([
                this.analyzeMessageSensitivity(userMessage),
                this.analyzeMessageSensitivity(aiResponse)
            ]);

            const userSalt = userId ? CryptoJS.SHA256(userId).toString().substring(0, 16) : '';

            let processedUserMessage = userMessage;
            let processedAiResponse = aiResponse;
            let userMessageHashed = false;
            let aiResponseHashed = false;

            // Process user message if sensitive
            if (userAnalysis.isSensitive && userAnalysis.confidence > 0.5) {
                const hashResult = this.hashMessage(userMessage, userSalt);
                if (hashResult.success) {
                    processedUserMessage = hashResult.hashedMessage;
                    userMessageHashed = true;
                    log('🔒 User message hashed due to sensitivity:', userAnalysis.reasons);
                }
            }

            // Process AI response if sensitive
            if (aiAnalysis.isSensitive && aiAnalysis.confidence > 0.5) {
                const hashResult = this.hashMessage(aiResponse, userSalt);
                if (hashResult.success) {
                    processedAiResponse = hashResult.hashedMessage;
                    aiResponseHashed = true;
                    log('🔒 AI response hashed due to sensitivity:', aiAnalysis.reasons);
                }
            }

            return {
                success: true,
                userMessage: processedUserMessage,
                aiResponse: processedAiResponse,
                privacy: {
                    userMessageHashed,
                    aiResponseHashed,
                    userAnalysis,
                    aiAnalysis,
                    processedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logError('🔒 Privacy processing failed:', error);
            // Return original messages if processing fails
            return {
                success: false,
                userMessage: userMessage,
                aiResponse: aiResponse,
                error: error.message
            };
        }
    }

    /**
     * Get pattern type for logging
     * @param {RegExp} pattern - The regex pattern
     * @returns {string} Pattern description
     */
    getPatternType(pattern) {
        const patternString = pattern.toString();
        if (patternString.includes('@')) return 'email address';
        if (patternString.includes('\\d{3}')) return 'phone number';
        if (patternString.includes('Street|Ave')) return 'address';
        if (patternString.includes('account')) return 'account number';
        return 'sensitive information';
    }
}

// Export singleton instance
export const privacyService = new PrivacyService();
export default privacyService;
