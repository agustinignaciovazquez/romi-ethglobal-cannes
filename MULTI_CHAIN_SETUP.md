# Multi-Chain RomiFactory with ENS Setup Guide

## Overview

This solution provides a multi-chain compatible RomiFactory that automatically handles ENS registration on Base chains while gracefully falling back to regular deployment on other chains.

## Key Features

✅ **Multi-Chain Support**: Deploy on any chain with the same contract
✅ **Automatic ENS Detection**: Only attempts ENS registration on Base/Base Sepolia  
✅ **Zero Address L2Registrar**: Supports deployment without L2Registrar on non-Base chains
✅ **Graceful Fallback**: Falls back to regular deployment if ENS registration fails
✅ **Chain-Aware Logging**: Clear logging about what's happening on each chain

## Architecture

```
Base Chains (8453, 84532):
RomiFactory → L2Registrar → L2Registry (ENS enabled)

Other Chains:
RomiFactory (L2Registrar = 0x0) → Regular deployment only
```

## Contract Updates

### RomiFactory.sol Changes

1. **Zero Address Support**: L2Registrar can be zero address in constructor
2. **New Modifier**: `requiresL2Registrar` prevents ENS calls on chains without registrar
3. **New Functions**:
   - `hasL2Registrar()`: Check if L2Registrar is available
   - Enhanced error handling with `L2RegistrarNotAvailable`

### API Route Updates

1. **Chain Detection**: Automatically detects Base chains (8453, 84532)
2. **Smart Fallback**: Attempts ENS registration only on supported chains
3. **Better Logging**: Clear messages about what's happening on each chain

## Deployment Strategy

### For Base Chains (with ENS)

```bash
# Set the L2Registrar address
export L2_REGISTRAR_ADDRESS=0x...  # Your L2Registrar address

# Deploy on Base Sepolia
pnpm hardhat run scripts/deploy-updated-factory.ts --network baseSepolia

# Deploy on Base Mainnet  
pnpm hardhat run scripts/deploy-updated-factory.ts --network base
```

### For Other Chains (without ENS)

```bash
# No L2_REGISTRAR_ADDRESS needed (will default to zero address)
unset L2_REGISTRAR_ADDRESS

# Deploy on other chains
pnpm hardhat run scripts/deploy-updated-factory.ts --network arbitrum
pnpm hardhat run scripts/deploy-updated-factory.ts --network optimism
```

## Usage Examples

### API Request (Same for All Chains)

```typescript
// Your API automatically handles chain detection
const response = await fetch('/api/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: userAddress,
    salt: uniqueSalt,
    config: configData,
    signature: signature,
    ensName: "myname"  // Will register on Base, ignored on other chains
  })
})

// Response tells you what happened
const result = await response.json()
// result.ensName will be "myname" if registered, null if not
```

### Contract Behavior by Chain

**Base Chains (8453, 84532):**
- ✅ ENS name provided → Deploy + Register ENS
- ✅ No ENS name → Regular deployment
- ⚠️ ENS name but registration fails → Fall back to regular deployment

**Other Chains:**
- ℹ️ ENS name provided → Log warning + Regular deployment
- ✅ No ENS name → Regular deployment

## Error Handling

### Contract Level

```solidity
// These errors can occur:
error L2RegistrarNotAvailable();  // Trying ENS on non-Base chain
error ENSNameNotAvailable();      // Name already taken
error ENSRegistrationFailed();    // Registration failed for other reason
```

### API Level

```typescript
// API handles errors gracefully:
try {
  // Attempt ENS registration
  tx = await factory.deployWithENS(SALT, bytecode, ensName, address);
} catch (error) {
  // Fall back to regular deployment
  tx = await factory.deploy(SALT, bytecode);
}
```

## Environment Variables

```bash
# Required for all chains
NEXT_PRIVATE_PK=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...  # Same address on all chains

# Required only for Base chains  
L2_REGISTRAR_ADDRESS=0x...  # Only set when deploying on Base chains

# Chain-specific RPC URLs
NEXT_PUBLIC_8453_RPC_URL=...     # Base Mainnet
NEXT_PUBLIC_84532_RPC_URL=...    # Base Sepolia  
NEXT_PUBLIC_42161_RPC_URL=...    # Arbitrum (example)
```

## Deployment Checklist

### 1. Deploy on Base Chains First

```bash
# Base Sepolia
export L2_REGISTRAR_ADDRESS=0x...
pnpm hardhat run scripts/deploy-updated-factory.ts --network baseSepolia

# Base Mainnet
export L2_REGISTRAR_ADDRESS=0x... 
pnpm hardhat run scripts/deploy-updated-factory.ts --network base
```

### 2. Deploy on Other Chains

```bash
# Clear L2Registrar (will use zero address)
unset L2_REGISTRAR_ADDRESS

# Deploy on other networks
pnpm hardhat run scripts/deploy-updated-factory.ts --network arbitrum
pnpm hardhat run scripts/deploy-updated-factory.ts --network optimism
```

### 3. Update Environment Variables

Use the same factory address from all deployments:

```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0x...  # Same address across all chains
```

### 4. Verify Contracts

```bash
# Verify Base chain deployment (with L2Registrar)
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> "<L2_REGISTRAR_ADDRESS>"

# Verify other chain deployment (with zero address)
npx hardhat verify --network arbitrum <FACTORY_ADDRESS> "0x0000000000000000000000000000000000000000"
```

## Testing

### Check Factory Configuration

```bash
# Use management script to check config
pnpm hardhat run scripts/manage-factory.ts --network baseSepolia
# Choose option 4 to view configuration

# Should show:
# - Owner: Your address
# - L2Registrar: Non-zero address (Base chains) or zero address (other chains)
# - ENS Support: Yes/No
```

### Test API Calls

```typescript
// Test with ENS name on Base
const baseResult = await fetch('/api/setup', {
  method: 'POST',
  body: JSON.stringify({
    address: "0x...",
    salt: "test-base",
    config: {...},
    signature: "0x...", 
    ensName: "testname"
  })
})
// Should register ENS name

// Test with ENS name on Arbitrum  
const arbResult = await fetch('/api/setup', {
  method: 'POST',
  body: JSON.stringify({
    address: "0x...",
    salt: "test-arb", 
    config: {...},
    signature: "0x...",
    ensName: "testname"  // Will be ignored
  })
})
// Should deploy without ENS, log warning
```

## Monitoring & Logs

The system provides clear logging:

```typescript
// Base chain with ENS
"Smart Account deployed with ENS name: myname on Base Sepolia"

// Base chain without L2Registrar  
"Warning: Factory has no L2Registrar on Base Sepolia, deploying without ENS"

// Non-Base chain with ENS requested
"ENS name myname requested but Arbitrum One doesn't support ENS registration"

// ENS registration failure
"ENS registration failed on Base Sepolia: [error details]"
```

## Migration from Single-Chain Setup

1. **Deploy new factory on Base chains** with your existing L2Registrar
2. **Deploy new factory on other chains** with zero L2Registrar  
3. **Update environment variables** with new factory address
4. **Transfer L2Registrar ownership** to factory (Base chains only)
5. **Test ENS registration** on Base chains
6. **Test regular deployment** on other chains

Your API calls remain the same - the system automatically handles chain differences!
