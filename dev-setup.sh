#!/bin/bash

echo "🚀 OLIVIA AI - DEVELOPMENT SETUP"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX is not installed. Please install it first:"
    echo "sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

print_status "DFX version: $(dfx --version)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
echo ""

# Stop any running dfx processes
print_status "Stopping any existing dfx processes..."
cd icp_backend
dfx stop 2>/dev/null || true
echo ""

# Start dfx with persistent state
print_status "Starting ICP local replica with PERSISTENT state..."
dfx start --background --clean &
sleep 5

# Wait for dfx to be ready
print_status "Waiting for dfx to be ready..."
for i in {1..30}; do
    if dfx ping &>/dev/null; then
        print_success "ICP local replica is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Timeout waiting for dfx to start"
        exit 1
    fi
    sleep 2
done
echo ""

# Deploy canister
print_status "Deploying ICP canister..."
dfx deploy

if [ $? -eq 0 ]; then
    print_success "Canister deployed successfully!"
else
    print_error "Failed to deploy canister"
    exit 1
fi
echo ""

# Show canister information
print_status "📡 Canister Information:"
CANISTER_ID=$(dfx canister id icp_backend_backend 2>/dev/null)
PRINCIPAL_ID=$(dfx identity get-principal 2>/dev/null)
echo "   Canister ID: $CANISTER_ID"
echo "   Principal ID: $PRINCIPAL_ID"
echo "   Local URL: http://127.0.0.1:4943/?canisterId=$CANISTER_ID"
echo ""

# Go back to root directory
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

print_success "🎉 DEVELOPMENT ENVIRONMENT IS READY!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run: npm run dev -- --port 3000"
echo "   2. Open: http://localhost:3000"
echo "   3. Your ICP canisters will now PERSIST between restarts!"
echo ""
echo "📚 Useful Commands:"
echo "   npm run icp:status  - Check canister status"
echo "   npm run icp:stop    - Stop ICP replica"
echo "   npm run icp:start   - Start ICP replica"
echo "   npm run dev:full    - Start everything at once"
echo ""
echo "💾 Data Persistence:"
echo "   - Your canister data is now saved in icp_backend/.dfx/"
echo "   - Only run 'npm run icp:clean' if you want to wipe everything"
echo ""
