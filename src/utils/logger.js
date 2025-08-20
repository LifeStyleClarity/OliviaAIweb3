/**
 * Conditional Logger Utility
 * 
 * Only shows console logs when VITE_NODE=development
 * In production, all logs are suppressed for cleaner console
 */

const isDevelopment = import.meta.env.VITE_NODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Export individual functions for easier importing
export const { log, error, warn, info, debug } = logger;

// Default export
export default logger;
