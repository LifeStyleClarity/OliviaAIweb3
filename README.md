# Olivia AI - Web3 Assistant on Internet Computer

An AI-powered web3 assistant built on the Internet Computer Protocol (ICP) that provides intelligent chat, wallet integration, and blockchain interactions.

## Features

- AI-powered chat assistant
- ICP blockchain integration
- Wallet connectivity (TON)
- Voice interactions
- Mobile-responsive design
- Decentralized backend on ICP

## Prerequisites

- Node.js (v18 or higher)
- DFX (Internet Computer SDK) - Install from https://internetcomputer.org/docs/current/developer-docs/setup/install/
- npm or yarn

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd OliviaAIweb3-clean
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run start-local
   ```

   This command will:
   - Start the local ICP network
   - Deploy the backend canister
   - Configure the frontend with the correct canister ID
   - Start the development server

3. **Access the application:**
   Open http://localhost:5173 in your browser

## Manual Setup (Alternative)

If you prefer to run commands separately:

```bash
# Start ICP network
dfx start --clean --background

# Deploy backend
npm run deploy

# Start frontend
npm run dev
```

## Architecture

- **Frontend**: React + Vite with TailwindCSS
- **Backend**: Motoko smart contract on ICP
- **Wallet Integration**: TON Connect
- **State Management**: React Context
- **Real-time**: WebSocket connections

## Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # Context providers
│   ├── api/               # API services and ICP integration
│   └── pages/             # Application pages
├── icp_backend/           # ICP backend canister
│   └── src/               # Motoko smart contract
└── public/                # Static assets
```

## Development

- The app automatically connects to the local ICP network
- Backend canister provides user management and data persistence
- Frontend communicates with ICP through @dfinity libraries
- Real-time features work via WebSocket connections

## Troubleshooting

If you encounter connection issues:
1. Ensure DFX is installed and updated
2. Check that the local ICP network is running: `dfx ping`
3. Redeploy if needed: `npm run deploy`

---

Built for ICP Hackathon - A decentralized AI assistant leveraging the power of the Internet Computer. 