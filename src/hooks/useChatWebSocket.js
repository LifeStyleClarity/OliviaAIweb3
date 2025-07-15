import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { chatService } from '../api';
import { useAuth } from '../contexts/AuthContext';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const useChatWebSocket = (onMessageReceived) => {
    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const retryAttemptRef = useRef(0);
    const hasCompletedRef = useRef(false);
    const lastMessageRef = useRef(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isBotResponding, setIsBotResponding] = useState(false);
    const { userData } = useAuth();

    const setupWebSocket = useCallback((messageData, isAgentChat = false) => {
        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const wsUrl = chatService.getChatWebSocketUrl(isAgentChat);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            //console.log("WebSocket Connected");
            setIsRetrying(false);
            retryAttemptRef.current = 0;
            if (messageData) {
                ws.send(JSON.stringify(messageData));
            }
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket message:", data); // REMOVE IN PRODUCTION

                if (data.status === "processing") {
                    onMessageReceived({
                        type: "processing",
                        message: typeof data.message === "object"
                            ? JSON.stringify(data.message)
                            : data.message || "Generating AI response..."
                    });
                } else if (data.status === "complete") {
                    // Mark as completed to prevent further retries
                    hasCompletedRef.current = true;
                    lastMessageRef.current = null;
                    setIsBotResponding(false);

                    // Keep the processing message visible briefly before showing the final answer
                    setTimeout(() => {
                        onMessageReceived({
                            type: "complete",
                            message: null
                        });

                        const botMessage = chatService.parseBotMessageContent(data.response);
                        if (botMessage) {
                            onMessageReceived({
                                type: "message",
                                data: {
                                    text: typeof botMessage.text === "object"
                                        ? JSON.stringify(botMessage.text)
                                        : botMessage.text || "",
                                    type: botMessage.type,
                                    meta: botMessage.meta,
                                    action_type: botMessage.action_type,
                                    sub_action_type: botMessage.sub_action_type,
                                    amount: botMessage.amount,
                                    swap_type: botMessage.swap_type,
                                    contract_address: botMessage.contract_address,
                                    sender: "bot",
                                    typingComplete: false,
                                    isNew: true,
                                }
                            });
                        }

                        // Close connection after successful response
                        if (wsRef.current) {
                            wsRef.current.close();
                            wsRef.current = null;
                        }

                        // Reset completion flag for next message
                        hasCompletedRef.current = false;
                    }, 500);
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error);
                toast.error("Error processing message");
                if (!isRetrying && !hasCompletedRef.current) {
                    retryConnection(messageData, isAgentChat);
                }
            }
        };

        ws.onerror = () => {
            console.error("WebSocket Error");
            toast.error("Connection error");
            if (!isRetrying && !hasCompletedRef.current) {
                retryConnection(messageData, isAgentChat);
            }
        };

        ws.onclose = () => {
            //console.log("WebSocket Disconnected");
            onMessageReceived({ type: "processing", message: null });
            if (lastMessageRef.current && !isRetrying && !hasCompletedRef.current) {
                retryConnection(messageData, isAgentChat);
            }
        };
    }, [onMessageReceived]);

    const retryConnection = useCallback((messageData, isAgentChat) => {
        if (isRetrying || hasCompletedRef.current) return;

        retryAttemptRef.current += 1;
        if (retryAttemptRef.current > MAX_RETRIES) {
            toast.error("Unable to get response");
            setIsBotResponding(false);
            setIsRetrying(false);
            retryAttemptRef.current = 0;
            hasCompletedRef.current = false;
            return;
        }

        setIsRetrying(true);

        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }

        // Exponential backoff delay
        const delay = Math.min(
            RETRY_DELAY * Math.pow(2, retryAttemptRef.current - 1),
            5000
        );
        // console.log(
        //     `Retrying connection attempt ${retryAttemptRef.current} in ${delay}ms`
        // );

        retryTimeoutRef.current = setTimeout(() => {
            try {
                setupWebSocket(messageData, isAgentChat);
            } catch (error) {
                console.error("Retry failed:", error);
                toast.error("Connection retry failed");
                retryConnection(messageData, isAgentChat);
            }
        }, delay);
    }, [setupWebSocket]);

    const sendMessage = useCallback(async (message, agent = null) => {
        try {
            // Clear any existing retries
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            setIsRetrying(false);
            retryAttemptRef.current = 0;
            hasCompletedRef.current = false;

            setIsBotResponding(true);

            // Pass empty string as user_id if userData or userData.user_id doesn't exist
            const userId = userData?.user_id || "";

            // Create message data using chat service with user ID from AuthContext
            const messageData = chatService.createMessageData(
                message.text,
                message.previousMessages || [],
                agent,
                userId
            );
            lastMessageRef.current = messageData;

            // Setup WebSocket with message data
            setupWebSocket(messageData, !!agent);
        } catch (error) {
            console.error("Failed to connect:", error);
            toast.error("Failed to connect to chat server");
            setIsBotResponding(false);
        }
    }, [setupWebSocket, userData]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
    }, []);

    return {
        sendMessage,
        disconnect,
        isBotResponding,
        isRetrying
    };
};

export default useChatWebSocket;
