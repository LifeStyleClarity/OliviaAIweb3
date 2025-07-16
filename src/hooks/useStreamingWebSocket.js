import { useRef, useCallback, useState, useEffect } from "react";
import { useWebSocket } from '../contexts/WebSocketContext';

const useStreamingWebSocket = (onMessageReceived) => {
    const unsubscribeRef = useRef(null);
    const { 
        isConnected, 
        isConnecting, 
        connectionAttempts, 
        wsError, 
        currentAction, 
        actionStatus, 
        isStreamingResponse,
        sendMessage,
        subscribe
    } = useWebSocket();

    // Handle messages from the persistent WebSocket connection
    const handleMessage = useCallback((message) => {
        if (onMessageReceived) {
            onMessageReceived(message);
        }
    }, [onMessageReceived]);

    // Subscribe to WebSocket messages when component mounts
    useEffect(() => {
        if (subscribe) {
            unsubscribeRef.current = subscribe(handleMessage);
        }

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [subscribe, handleMessage]);

    // Send streaming message using the persistent connection
    const sendStreamingMessage = useCallback(async (message, conversationHistory = [], searchEnabled = false, imageEnabled = false) => {
        if (!sendMessage) {
            console.error('Send message function not available');
            return false;
        }

        try {
            const result = await sendMessage(message, conversationHistory, searchEnabled, imageEnabled);
            return result;
        } catch (error) {
            console.error('Error sending streaming message:', error);
            return false;
        }
    }, [sendMessage]);

    // Legacy disconnect function (no-op since connection is managed globally)
    const disconnect = useCallback(() => {
        // Connection is managed globally, so this is a no-op
        console.log('Disconnect called on streaming WebSocket hook (managed globally)');
    }, []);

    return {
        isConnected,
        isConnecting,
        connectionAttempts,
        wsError,
        currentAction,
        actionStatus,
        isStreamingResponse,
        sendStreamingMessage,
        disconnect
    };
};

export default useStreamingWebSocket; 