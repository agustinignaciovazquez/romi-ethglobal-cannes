# Romi wallet design

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/agustin-poapios-projects/v0-romi-wallet-design)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/EHNg5MIE1ck)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Smart Contract Deployment

### Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```bash
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ETHERSCAN_API_KEY=your_unified_etherscan_api_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   ```

3. **Compile contracts:**
   ```bash
   pnpm compile
   ```

### Deploy to Localhost (for testing)

1. **Start a local Hardhat node:**
   ```bash
   pnpm node
   ```
   
2. **Deploy to localhost (in a new terminal):**
   ```bash
   pnpm deploy:localhost
   ```

### Deploy to Base Sepolia

1. **Make sure you have testnet ETH in your wallet**
   - Get Base Sepolia ETH from a faucet
   - Your wallet needs at least 0.01 ETH for deployment

2. **Deploy to Base Sepolia:**
   ```bash
   pnpm deploy:baseSepolia
   ```

3. **Set up ENS L1 Resolver (Sepolia):**
   After deploying to Base Sepolia, you need to configure the L1 resolver on Sepolia:
   ```bash
   pnpm setup:ens
   ```
   
   You'll need:
   - Your ENS name (e.g., `yourname.eth`)
   - The L2 registry address (from step 2 output)
   - The target chain ID (84532 for Base Sepolia)
   - Sepolia ETH for gas fees

4. **Verify contracts (optional):**
   The deployment script will provide verification commands. Run them to verify your contracts on BaseScan.

### Complete ENS Setup Process

The deployment process is split into two parts for better organization:

1. **L2 Deployment (Base Sepolia)**: Deploys the registry and registrar contracts
2. **L1 Setup (Sepolia)**: Configures the ENS resolver to point to your L2 registry

This separation ensures proper network configuration and avoids RPC conflicts.

### Available Scripts

- `pnpm deploy:localhost` - Deploy to local Hardhat node
- `pnpm deploy:baseSepolia` - Deploy L2 contracts to Base Sepolia
- `pnpm setup:ens` - Configure ENS L1 resolver on Sepolia
- `pnpm compile` - Compile contracts
- `pnpm test` - Run tests
- `pnpm node` - Start local Hardhat node

## Deployment

Your project is live at:

**[https://vercel.com/agustin-poapios-projects/v0-romi-wallet-design](https://vercel.com/agustin-poapios-projects/v0-romi-wallet-design)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/EHNg5MIE1ck](https://v0.dev/chat/projects/EHNg5MIE1ck)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
