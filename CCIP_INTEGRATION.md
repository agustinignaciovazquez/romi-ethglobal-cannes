# CCIP Integration for RomiSmartAccount

This document explains how to use the Chainlink CCIP (Cross-Chain Interoperability Protocol) integration in your RomiSmartAccount to transfer tokens across different blockchains after performing 1inch swaps.

## Overview

The RomiSmartAccount now supports:
- ✅ 1inch token swaps
- ✅ Cross-chain token transfers via Chainlink CCIP
- ✅ Combined swap + cross-chain transfer in a single transaction
- ✅ Native ETH payment for CCIP fees
- ✅ Support for multiple chains (Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base)

## Deployment

Use the deployment script to deploy your RomiSmartAccount with CCIP support:

```bash
# Deploy on your desired chain
npx hardhat run scripts/deploy-romi-smart-account.ts --network sepolia

# Optional: Allowlist common destination chains during deployment
ALLOWLIST_CHAINS=true npx hardhat run scripts/deploy-romi-smart-account.ts --network sepolia
```

## Configuration

### 1. Fund the Smart Account

Your smart account needs ETH to pay for CCIP fees:

```javascript
// Send ETH to your smart account address
const tx = await deployer.sendTransaction({
  to: smartAccountAddress,
  value: ethers.parseEther("0.1") // 0.1 ETH for fees
});
```

### 2. Configure Output Token

Set the token that will be used for cross-chain transfers:

```javascript
// This should be called with a proper signature from the owner
await smartAccount.updateConfigWithSig(
  "0x...", // USDC token address (example)
  137,     // Polygon chain ID (example)
  0,       // nonce
  signature
);
```

### 3. Allowlist Destination Chains

Allowlist the chains you want to transfer tokens to:

```javascript
// Allowlist Polygon (chain selector: 4051577828743386545)
await smartAccount.allowlistDestinationChain(
  "4051577828743386545", // Polygon mainnet selector
  true
);

// Allowlist Arbitrum (chain selector: 4949039107694359620)
await smartAccount.allowlistDestinationChain(
  "4949039107694359620", // Arbitrum One selector
  true
);
```

## Usage Examples

### Method 1: Separate Swap and Transfer

```javascript
// 1. First, execute a 1inch swap
const swapData = "0x..."; // 1inch swap calldata
await smartAccount.executeSwap(swapData);

// 2. Then transfer tokens cross-chain
const messageId = await smartAccount.transferTokensCrossChain(
  "4051577828743386545", // Polygon chain selector
  "0x...",               // receiver address on Polygon
  "0x...",               // USDC token address
  ethers.parseUnits("100", 6) // 100 USDC
);

console.log("CCIP Message ID:", messageId);
```

### Method 2: Combined Swap + Cross-Chain Transfer ⭐

```javascript
// Execute swap and immediately transfer cross-chain in one transaction
const messageId = await smartAccount.swapAndTransferCrossChain(
  swapData,              // 1inch swap calldata
  "4051577828743386545", // Polygon chain selector
  "0x...",               // receiver address on Polygon
  0                      // 0 = transfer all received tokens
);

console.log("CCIP Message ID:", messageId);
```

### Method 3: Check Fees Before Transfer

```javascript
// Get the estimated fee for cross-chain transfer
const fee = await smartAccount.getCrossChainFee(
  "4051577828743386545", // destination chain selector
  "0x...",               // token address
  ethers.parseUnits("100", 6) // amount
);

console.log("Estimated fee:", ethers.formatEther(fee), "ETH");

// Make sure your smart account has enough ETH
const balance = await ethers.provider.getBalance(smartAccountAddress);
if (balance < fee) {
  console.log("Need to fund smart account with more ETH");
}
```

## Supported Chains and Selectors

### Mainnets
- **Ethereum**: `5009297550715157269`
- **Polygon**: `4051577828743386545`
- **BSC**: `11344663589394136015`
- **Avalanche**: `6433500567565415381`
- **Arbitrum**: `4949039107694359620`
- **Optimism**: `3734403246176062136`
- **Base**: `15971525489660198786`

### Testnets
- **Ethereum Sepolia**: `16015286601757825753`
- **Polygon Amoy**: `16281711391670634445`
- **BSC Testnet**: `13264668187771770619`
- **Avalanche Fuji**: `14767482510784806043`
- **Arbitrum Sepolia**: `3478487238524512106`
- **Optimism Sepolia**: `5224473277236331295`
- **Base Sepolia**: `10344971235874465080`

## Gas Considerations

- CCIP fees are paid in native ETH
- Fees vary based on destination chain and token amount
- Always check fees before executing transfers
- Keep some ETH buffer in your smart account

## Security Notes

⚠️ **Important Security Considerations:**

1. Only allowlist chains you trust
2. Always verify the receiver address on destination chain
3. The configured token in `config.token` is the only token that can be transferred cross-chain
4. Monitor your smart account balance to ensure sufficient ETH for fees
5. CCIP transfers are irreversible once initiated

## Troubleshooting

### Common Issues

1. **"DestinationChainNotAllowlisted"**: Make sure to allowlist the destination chain first
2. **"NotEnoughBalance"**: Fund your smart account with more ETH for fees
3. **"Token not configured"**: Set the output token using `updateConfigWithSig()`
4. **"Invalid receiver address"**: Check that receiver address is not zero address

### Getting Help

- Check CCIP documentation: https://docs.chain.link/ccip
- Monitor CCIP explorer: https://ccip.chain.link/
- Verify chain selectors: https://docs.chain.link/ccip/supported-networks

## Example Complete Flow

```javascript
// 1. Deploy and configure
const smartAccount = await deployRomiSmartAccount();

// 2. Fund with ETH
await fundAccount(smartAccount.address, "0.1");

// 3. Configure token (USDC)
await configureOutputToken(smartAccount, USDC_ADDRESS);

// 4. Allowlist Polygon
await smartAccount.allowlistDestinationChain("4051577828743386545", true);

// 5. Execute swap + cross-chain transfer
const messageId = await smartAccount.swapAndTransferCrossChain(
  swap1inchETHtoUSDC,    // swap ETH to USDC
  "4051577828743386545", // send to Polygon
  receiverAddress,       // receiver on Polygon
  0                      // transfer all USDC received
);

console.log("🎉 Cross-chain transfer initiated:", messageId);
```

This integration enables seamless cross-chain DeFi operations by combining the best liquidity from 1inch with the reliable cross-chain infrastructure of Chainlink CCIP.
