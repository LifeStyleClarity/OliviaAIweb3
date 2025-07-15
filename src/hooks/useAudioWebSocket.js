import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { chatService } from '../api';
import { useAuth } from '../contexts/AuthContext';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1 second delay

const useAudioWebSocket = (onMessageReceived) => {
    const wsRef = useRef(null);
    const connectPromiseRef = useRef(null);
    const retryCountRef = useRef(0);
    const [isConnecting, setIsConnecting] = useState(false);
    const isCompleteRef = useRef(false);
    const { userData } = useAuth();

    const connect = useCallback(() => {
        if (isConnecting) {
            return connectPromiseRef.current;
        }

        setIsConnecting(true);
        connectPromiseRef.current = new Promise((resolve, reject) => {
            // Close any existing connection
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            //console.log("Connecting to WebSocket...");
            const ws = new WebSocket(chatService.getAudioWebSocketUrl());
            wsRef.current = ws;

            const connectionTimeout = setTimeout(() => {
                console.error("WebSocket connection timeout");
                ws.close();
                toast.error("Connection timeout");
                reject(new Error("Connection timeout"));
            }, 5000);

            ws.onopen = () => {
                //console.log("Audio WebSocket Connected");
                clearTimeout(connectionTimeout);
                setIsConnecting(false);
                retryCountRef.current = 0;
                isCompleteRef.current = false;
                resolve(ws);
            };

            ws.onmessage = async (event) => {
                try {
                    // Assume that the server sends JSON responses.
                    const data = JSON.parse(event.data);
                    //console.log("Audio WebSocket message:", data); // REMOVE IN PRODUCTION

                    // Handle different response types
                    if (data.status === "complete") {
                        isCompleteRef.current = true;
                        try {
                            // Parse audio response using chat service
                            const messageData = await chatService.parseAudioResponse(data.response);
                            if (messageData) {
                                onMessageReceived(messageData);
                            }

                            // Also handle the text response if needed
                            if (data.response?.final_answer) {
                                onMessageReceived({
                                    type: "text",
                                    data: data.response?.final_answer?.message || data.response.final_answer,
                                });
                            }
                        } finally {
                            // Close the connection after handling complete status
                            //console.log("Received complete status, closing connection");
                            ws.close();
                        }
                    } else if (data.status === "processing") {
                        onMessageReceived({ type: "processing", data: data.message });
                    }
                } catch (error) {
                    console.error("Error handling Audio WebSocket message:", error);
                    toast.error("Error processing audio message");
                }
            };

            ws.onerror = (error) => {
                console.error("Audio WebSocket Error:", error);
                toast.error("Audio connection error");
                if (!ws.OPEN) {
                    reject(error);
                }
            };

            ws.onclose = () => {
                //console.log("Audio WebSocket Disconnected");
                setIsConnecting(false);

                // Only attempt reconnection if not complete and not manually closed
                if (!isCompleteRef.current && retryCountRef.current < MAX_RETRIES) {
                    //console.log(`Attempting reconnection (${retryCountRef.current + 1}/${MAX_RETRIES})...`);
                    const delay = RETRY_DELAY * Math.pow(2, retryCountRef.current);
                    retryCountRef.current++;
                    setTimeout(() => {
                        connect().catch((error) => {
                            console.error("Reconnection failed:", error);
                            toast.error("Audio reconnection failed");
                        });
                    }, delay);
                } else if (retryCountRef.current >= MAX_RETRIES) {
                    console.error("Max reconnection attempts reached");
                    toast.error("Max audio reconnection attempts reached");
                    reject(new Error("Max reconnection attempts reached"));
                }
            };
        });

        return connectPromiseRef.current;
    }, [onMessageReceived]);

    const sendAudio = useCallback(async (audioBlob, trade_style = "Manual") => {
        try {
            //console.log("Starting audio send process...");

            // Validate audio blob
            if (!audioBlob || !(audioBlob instanceof Blob)) {
                toast.error("Invalid audio data");
                throw new Error("Invalid audio data");
            }

            // Pass empty string as user_id if userData or userData.user_id doesn't exist
            const userId = userData?.user_id || "";

            // Ensure connection is established
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                //console.log("WebSocket not connected, establishing connection...");
                await connect();
            }

            // Create audio message data using chat service with user ID from AuthContext
            const data = await chatService.createAudioMessageData(audioBlob, trade_style, userId);

            //console.log("Sending audio data to server...");
            wsRef.current.send(JSON.stringify(data));
            //console.log("Audio data sent successfully");
        } catch (error) {
            console.error("Error sending audio:", error);
            toast.error("Failed to send audio message");
            throw error;
        }
    }, [connect, userData]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    return {
        sendAudio,
        disconnect,
    };
};

export default useAudioWebSocket;
