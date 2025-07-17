// Olivia chat utilities for inline chat system
let extraDataRef = null;
let isWebsocketRunningRef = false;
let chatOpenCallback = null;

// Legacy function - no longer used with inline chat
export function initializeChat(setIsOpen) {
  console.log('initializeChat called but not needed for inline chat');
}

// Set the callback function to open chat
export function setChatOpenCallback(callback) {
  chatOpenCallback = callback;
}

// Store extra data for chat usage and open chat
export function startOliviaChat(extraData) {
  extraDataRef = extraData;
  console.log('🚀 Olivia chat data stored:', extraData);
  
  // Open the chat if callback is available
  if (chatOpenCallback) {
    chatOpenCallback(true);
  }
}

export function getExtraData() {
  return extraDataRef;
}

export function clearExtraData() {
  extraDataRef = null;
}

export function setWebsocketRunning(isRunning) {
  isWebsocketRunningRef = isRunning;
}

export function isWebsocketRunning() {
  return isWebsocketRunningRef;
}
