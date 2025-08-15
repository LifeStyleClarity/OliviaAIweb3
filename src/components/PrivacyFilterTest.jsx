import React, { useState } from 'react';
import { privacyService } from '../api/services/privacy.service.js';

/**
 * Privacy Filter Test Component
 * This component allows testing the privacy filter functionality
 */
const PrivacyFilterTest = () => {
    const [testMessage, setTestMessage] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Test messages with different sensitivity levels
    const testMessages = [
        {
            label: "Safe Message",
            message: "Hello! How are you doing today? I love talking about technology and AI."
        },
        {
            label: "Email Address",
            message: "My email is john.doe@example.com, please contact me there."
        },
        {
            label: "Phone Number",
            message: "You can reach me at (555) 123-4567 anytime after 5pm."
        },
        {
            label: "Credit Card Info",
            message: "My credit card number is 4532 1234 5678 9012 with CVV 123."
        },
        {
            label: "Personal Address",
            message: "I live at 123 Main Street, Anytown, CA 90210. Come visit!"
        },
        {
            label: "Medical Info",
            message: "I was diagnosed with diabetes last month and my doctor prescribed medication."
        }
    ];

    const handleTestMessage = async (message) => {
        setIsLoading(true);
        setTestResult(null);
        
        try {
            console.log('🔒 Testing privacy filter with message:', message.substring(0, 50) + '...');
            
            // Test the privacy analysis
            const analysis = await privacyService.analyzeMessageSensitivity(message);
            console.log('🔒 Analysis result:', analysis);
            
            // Test the full message processing
            const processed = await privacyService.processMessages(message, "Thank you for sharing that.", "test_user_123");
            console.log('🔒 Processing result:', processed);
            
            setTestResult({
                analysis,
                processed,
                originalMessage: message
            });
            
        } catch (error) {
            console.error('🔒 Privacy filter test failed:', error);
            setTestResult({
                error: error.message,
                originalMessage: message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomTest = async () => {
        if (!testMessage.trim()) return;
        await handleTestMessage(testMessage);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🔒 Privacy Filter Test</h2>
            
            {/* Predefined Test Messages */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Test with Predefined Messages:</h3>
                <div className="grid gap-2">
                    {testMessages.map((test, index) => (
                        <button
                            key={index}
                            onClick={() => handleTestMessage(test.message)}
                            disabled={isLoading}
                            className="p-3 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <span className="font-medium text-blue-800">{test.label}:</span>
                            <span className="text-gray-600 ml-2">{test.message.substring(0, 60)}...</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Message Test */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Test with Custom Message:</h3>
                <div className="flex gap-2">
                    <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Enter your test message here..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg resize-none h-20"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleCustomTest}
                        disabled={isLoading || !testMessage.trim()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Testing...' : 'Test'}
                    </button>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="text-center py-4">
                    <div className="inline-flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-gray-600">Analyzing message privacy...</span>
                    </div>
                </div>
            )}

            {/* Test Results */}
            {testResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Test Results:</h3>
                    
                    {testResult.error ? (
                        <div className="text-red-600 p-3 bg-red-50 rounded border border-red-200">
                            <strong>Error:</strong> {testResult.error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Original Message */}
                            <div>
                                <h4 className="font-medium text-gray-700">Original Message:</h4>
                                <p className="text-sm text-gray-600 bg-white p-2 rounded border italic">
                                    "{testResult.originalMessage}"
                                </p>
                            </div>

                            {/* Privacy Analysis */}
                            {testResult.analysis && (
                                <div>
                                    <h4 className="font-medium text-gray-700">Privacy Analysis:</h4>
                                    <div className="bg-white p-3 rounded border space-y-2">
                                        <div className={`flex items-center ${testResult.analysis.isSensitive ? 'text-red-600' : 'text-green-600'}`}>
                                            <span className="font-medium">
                                                {testResult.analysis.isSensitive ? '⚠️ SENSITIVE' : '✅ SAFE'}
                                            </span>
                                            <span className="ml-2 text-sm">
                                                (Confidence: {Math.round(testResult.analysis.confidence * 100)}%)
                                            </span>
                                        </div>
                                        
                                        {testResult.analysis.reasons?.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-600">Reasons:</span>
                                                <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                                                    {testResult.analysis.reasons.map((reason, idx) => (
                                                        <li key={idx}>{reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="text-sm text-gray-500">
                                            Method: {testResult.analysis.method}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Processing Result */}
                            {testResult.processed && (
                                <div>
                                    <h4 className="font-medium text-gray-700">Processing Result:</h4>
                                    <div className="bg-white p-3 rounded border space-y-2">
                                        <div className="text-sm">
                                            <span className="font-medium">User Message Hashed:</span>
                                            <span className={`ml-2 ${testResult.processed.privacy?.userMessageHashed ? 'text-red-600' : 'text-green-600'}`}>
                                                {testResult.processed.privacy?.userMessageHashed ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">AI Response Hashed:</span>
                                            <span className={`ml-2 ${testResult.processed.privacy?.aiResponseHashed ? 'text-red-600' : 'text-green-600'}`}>
                                                {testResult.processed.privacy?.aiResponseHashed ? 'YES' : 'NO'}
                                            </span>
                                        </div>
                                        
                                        {testResult.processed.privacy?.userMessageHashed && (
                                            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                                <strong>Stored in ICP:</strong> [Hashed content - privacy protected]
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PrivacyFilterTest;
