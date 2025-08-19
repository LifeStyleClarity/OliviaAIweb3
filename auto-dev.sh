#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[AUTO-DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🚀 Auto-starting development environment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX not found. Run './dev-setup.sh' first to install dependencies."
    exit 1
fi

# Check if dfx is already running
cd icp_backend
if dfx ping &>/dev/null; then
    print_warning "ICP replica already running - skipping setup"
    cd ..
    
    # Just start the React dev server
    print_status "Starting React dev server on port 3000..."
    npm run dev -- --port 3000
    exit 0
fi

print_status "ICP replica not running - starting automatically..."

# Start dfx in background
dfx start --background &>/dev/null &
DFX_PID=$!

# Wait for dfx to be ready (with timeout)
print_status "Waiting for ICP replica to start..."
for i in {1..20}; do
    if dfx ping &>/dev/null; then
        print_success "ICP replica is ready!"
        break
    fi
    if [ $i -eq 20 ]; then
        print_error "Timeout waiting for dfx to start. Try: ./dev-setup.sh"
        exit 1
    fi
    sleep 2
done

# Check if canister is deployed
if ! dfx canister status icp_backend_backend &>/dev/null; then
    print_status "Deploying ICP canister..."
    dfx deploy &>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Canister deployed!"
    else
        print_error "Failed to deploy canister. Try: ./dev-setup.sh"
        exit 1
    fi
else
    print_warning "Canister already deployed - skipping"
fi

# Show canister info
CANISTER_ID=$(dfx canister id icp_backend_backend 2>/dev/null)
print_success "ICP Backend ready! Canister ID: $CANISTER_ID"

cd ..

# Start React dev server
print_status "Starting React dev server on port 3000..."
print_success "🎉 Full development environment is ready!"
echo ""
npm run dev -- --port 3000
