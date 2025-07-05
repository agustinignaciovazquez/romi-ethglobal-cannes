# RomiFactory with ENS Integration Setup Guide

## Overview

This solution integrates ENS registration directly into the `RomiFactory` contract. When deploying smart accounts, you can now optionally register an ENS name in the same transaction. The factory becomes the owner of the L2Registrar, ensuring controlled access to ENS registration.

## Key Features

1. **Integrated ENS Registration**: Deploy smart accounts and register ENS names in a single transaction
2. **Factory Ownership**: RomiFactory owns the L2Registrar for controlled access
3. **Backward Compatibility**: Still supports deployment without ENS registration
4. **Ownership Management**: Includes functions to transfer factory ownership and manage L2Registrar

## Architecture

```
RomiFactory (owned by NEXT_PRIVATE_PK holder)
    ↓ owns
L2Registrar
    ↓ registers names in
L2Registry
```

## Setup Steps

### 1. Deploy or Update RomiFactory

If you have an existing L2Registrar, you can deploy the updated factory:

```bash
# Set the L2Registrar address
export L2_REGISTRAR_ADDRESS=0x...  # Your existing L2Registrar address

# Deploy the updated factory
pnpm hardhat run scripts/deploy-updated-factory.ts --network baseSepolia
```

### 2. Transfer L2Registrar Ownership

The L2Registrar must be owned by the RomiFactory for ENS registration to work:

```bash
# This should be done automatically by the deployment script
# If manual transfer is needed:
pnpm hardhat run scripts/manage-factory.ts --network baseSepolia
# Choose option 4 to view configuration and verify ownership
```

### 3. Update Environment Variables

```bash
# Update your .env file with the new factory address
NEXT_PUBLIC_FACTORY_ADDRESS=0x...  # New factory address from deployment
```

## Usage

### API Integration

Your API now supports an optional `ensName` parameter:

```typescript
// With ENS registration
const response = await fetch('/api/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: userAddress,
    salt: uniqueSalt,
    config: configData,
    signature: signature,
    ensName: "myname"  // Optional: will register myname.eth
  })
})

// Without ENS registration (existing behavior)
const response = await fetch('/api/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: userAddress,
    salt: uniqueSalt,
    config: configData,
    signature: signature
    // No ensName parameter
  })
})
```

### Smart Contract Functions

The updated RomiFactory includes these new functions:

```solidity
// Deploy with ENS registration (only owner)
function deployWithENS(
    bytes32 salt,
    bytes memory creationCode,
    string calldata ensName,
    address nameOwner
) external payable onlyOwner returns (address deployed)

// Check ENS availability
function checkENSAvailability(string calldata ensName) external view returns (bool)

// Transfer factory ownership
function transferOwnership(address newOwner) external onlyOwner

// Update L2Registrar address
function setL2Registrar(address newRegistrar) external onlyOwner
```

### Error Handling

The factory will revert with specific errors:

- `ENSNameNotAvailable()`: The requested ENS name is already taken
- `ENSRegistrationFailed()`: ENS registration failed for some reason
- `NotOwner()`: Only factory owner can call owner-only functions

## Management

### Factory Management

Use the management script to perform administrative tasks:

```bash
pnpm hardhat run scripts/manage-factory.ts --network baseSepolia
```

Available actions:
1. Transfer factory ownership
2. Set new L2Registrar address
3. Check ENS name availability
4. View factory configuration

### Ownership Transfer

To transfer factory ownership (be very careful):

```bash
# Use the management script
pnpm hardhat run scripts/manage-factory.ts --network baseSepolia
# Choose option 1 and provide the new owner address
```

## Events

The factory emits these events for tracking:

```solidity
event SmartAccountDeployed(address indexed smartAccount, address indexed user, string ensName);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event L2RegistrarUpdated(address indexed newRegistrar);
```

## Frontend Integration

### Check ENS Availability

```typescript
const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
const isAvailable = await factory.checkENSAvailability("myname");
```

### Monitor Deployments

```typescript
factory.on("SmartAccountDeployed", (smartAccount, user, ensName) => {
  console.log(`Smart account ${smartAccount} deployed for ${user} with ENS: ${ensName}.eth`);
});
```

## Security Considerations

1. **Factory Owner Security**: The factory owner (your NEXT_PRIVATE_PK) controls all ENS registrations
2. **L2Registrar Ownership**: Ensure the L2Registrar is owned by the factory, not an EOA
3. **ENS Name Validation**: Always check availability before attempting registration
4. **Ownership Transfer**: Be extremely careful when transferring factory ownership

## Verification

After deployment, verify the contracts:

```bash
# Verify the factory
npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> "<L2_REGISTRAR_ADDRESS>"
```

## Troubleshooting

### Common Issues

1. **ENS registration fails**: Ensure L2Registrar is owned by RomiFactory
2. **"NotOwner" error**: Ensure your NEXT_PRIVATE_PK address owns the factory
3. **Name not available**: Check availability before registration

### Debug Commands

```bash
# Check factory configuration
pnpm hardhat run scripts/manage-factory.ts --network baseSepolia
# Choose option 4

# Check L2Registrar owner
npx hardhat console --network baseSepolia
# Then run: await ethers.getContractAt("L2Registrar", "ADDRESS").then(c => c.owner())
```

## Migration from Existing Setup

If you have an existing RomiFactory without ENS integration:

1. Deploy the new factory with your existing L2Registrar address
2. Update your environment variables
3. Transfer L2Registrar ownership to the new factory
4. Update your API calls to use the new factory address
5. Optionally add ENS names to your deployment requests

The new factory is backward compatible - existing functionality works unchanged.
