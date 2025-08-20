# WebSocketProvider Multiple Mounting Analysis

## 🔍 Root Causes

### 1. React.StrictMode (Primary Cause)
**Location**: `src/main.jsx:37`
```jsx
<React.StrictMode>  // This causes double-mounting in development
```
**Impact**: Every component mounts twice in development mode (intentional React behavior)

### 2. useCallback Dependencies Issue  
**Location**: `src/contexts/WebSocketContext.jsx:808-825, 874-883`
```jsx
// Problem: initializeICP is recreated on every render
useEffect(() => {
  // This runs every time initializeICP changes
}, [userData, isGuestUser, icpInitialized, initializeICP]); // <- initializeICP changes frequently

useEffect(() => {
  window.forceICPInit = () => {
    initializeICP(); // This reference changes
  };
}, [initializeICP]); // <- Triggers re-render when initializeICP changes
```

### 3. Multiple useEffect Hooks
**Location**: `src/contexts/WebSocketContext.jsx`
- Line 60: Debug state changes  
- Line 808: ICP Auto-init
- Line 828: Backup ICP init  
- Line 844: Auto-connect on mount
- Line 874: Global debugging exposure

## 🚨 Console Output Pattern
```
🟦 WebSocketProvider mounting...
🟦 ICP Auto-init useEffect running: { userData: true, isGuestUser: false, icpInitialized: true, hasInitializeICP: true }
🔌 Auto-connecting on mount...
🟦 WebSocketProvider mounting...  // <- DUPLICATE from StrictMode
🟦 ICP Auto-init useEffect running: { userData: true, isGuestUser: false, icpInitialized: true, hasInitializeICP: true }
🔌 Auto-connecting on mount...
```

## 🛠️ Solutions

### Option 1: Remove StrictMode (Quick Fix)
**File**: `src/main.jsx`
```jsx
// Remove React.StrictMode wrapper
createRoot(document.getElementById('root')).render(
  // <React.StrictMode>  // <- Comment out for production-like behavior
    <ErrorBoundary>
      {/* ... rest of app */}
    </ErrorBoundary>
  // </React.StrictMode>
);
```

### Option 2: Fix useCallback Dependencies (Proper Fix)
**File**: `src/contexts/WebSocketContext.jsx`
```jsx
// Memoize initializeICP to prevent recreation
const initializeICP = useCallback(async () => {
  // ... existing logic
}, [conversationId]); // <- Only include stable dependencies

// Or use useRef for stable function reference
const initializeICPRef = useRef();
initializeICPRef.current = async () => {
  // ... existing logic
};
```

### Option 3: Add Mount Tracking (Debug Solution)
**File**: `src/contexts/WebSocketContext.jsx`
```jsx
export const WebSocketProvider = ({ children }) => {
  const mountId = useRef(Math.random().toString(36).substr(2, 9));
  console.log(`🟦 WebSocketProvider mounting... (ID: ${mountId.current})`);
  
  // Add to cleanup
  useEffect(() => {
    return () => {
      console.log(`🟦 WebSocketProvider unmounting... (ID: ${mountId.current})`);
    };
  }, []);
};
```

## 🎯 Recommended Action
1. **Keep StrictMode** (it's valuable for detecting issues)
2. **Fix useCallback dependencies** to prevent unnecessary re-renders
3. **Add mount tracking** for better debugging
4. **Consolidate useEffect hooks** where possible
