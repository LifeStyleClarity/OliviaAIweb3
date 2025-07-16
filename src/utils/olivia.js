// Get the setIsOpen function and extra data from context
let setIsOpenRef = null;
let extraDataRef = null;
let isWebsocketRunningRef = false;

export function initializeChat(setIsOpen) {
  setIsOpenRef = setIsOpen;
}

export function startOliviaChat(extraData) {
  if (setIsOpenRef) {
    extraDataRef = extraData;
    setIsOpenRef(true);
  } else {
    console.error('❌ setIsOpenRef is not available!');
  }
}

export function getExtraData() {
  return extraDataRef;
}

export function setWebsocketRunning(isRunning) {
  isWebsocketRunningRef = isRunning;
}

export function isWebsocketRunning() {
  return isWebsocketRunningRef;
}
