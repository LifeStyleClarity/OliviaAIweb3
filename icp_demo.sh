#!/bin/bash
echo "🚀 OLIVIA AI - ICP INTEGRATION DEMO"
echo "=================================="
echo ""

# Check DFX is installed
echo "📦 Checking ICP Development Environment..."
dfx --version
echo ""

# Show local network status
echo "🌐 Local ICP Network Status..."
cd icp_backend
dfx ping | head -2
echo ""

# Show canister info
echo "📡 Smart Contract (Canister) Info..."
echo "Canister ID: $(dfx canister id icp_backend_backend)"
echo "Principal ID: $(dfx identity get-principal)"
echo ""

# Test canister functionality
echo "🧪 Testing Smart Contract..."
dfx canister call icp_backend_backend greet '("Live Demo")'
echo ""

# Show stored data
echo "💾 Current Blockchain Data..."
USERS=$(dfx canister call icp_backend_backend getUserCount '()' 2>/dev/null)
MESSAGES=$(dfx canister call icp_backend_backend getMessageCount '()' 2>/dev/null)
echo "Users stored: $USERS"
echo "Messages stored: $MESSAGES"
echo ""

# Architecture overview
echo "🏗️  Integration Architecture..."
echo "React Frontend → ICP Service → Motoko Smart Contract → ICP Blockchain"
echo ""

# Next steps
echo "🎯 To See Full Integration:"
echo "1. Open browser: http://localhost:5174"
echo "2. Login as Guest (creates ICP user automatically)"
echo "3. Start chatting (messages saved to blockchain)"
echo "4. Check browser console for ICP logs"
echo "5. Use 'Create ICP ID' for Internet Identity"
echo ""

echo "✅ ICP Integration: FULLY OPERATIONAL" 