import { ethers, TypedDataDomain } from 'ethers'
import Create3FactoryArtifact from '@/artifacts/contracts/romi/RomiFactory.sol/RomiFactory.json'
import { getDeployerAddress, getRomiDefaultProvider } from './chain'

export function getFactoryAddress(): string {
  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS
  if (!factoryAddress) {
    throw new Error("Factory address is not set in environment variables")
  }
  return factoryAddress
}

export async function signSmartAccountConfig(
  signer: any,
  config: {
    token: string
    chainId: bigint
    nonce: bigint
  },
  smartAccountAddress: string,
): Promise<string> {
  const domain: TypedDataDomain = {
    name: "Romi Smart Account",
    version: "1",
    verifyingContract: smartAccountAddress,
  }

  const types = {
    Config: [
      { name: "token", type: "address" },
      { name: "chainId", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  }

  return signer.signTypedData(domain, types, config)
}

export function getSaltHash(salt: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(salt))
}

export async function getSmartWalletAddress(chainId: number, salt: string): Promise<string> {
  try {
    const provider = getRomiDefaultProvider(chainId);
    const factoryAddress = getFactoryAddress();
    const factory = new ethers.Contract(factoryAddress, Create3FactoryArtifact.abi, provider);

    // Check if the contract exists at this address
    const code = await provider.getCode(factoryAddress);
    if (code === '0x') {
      throw new Error(`No contract deployed at factory address: ${factoryAddress}`);
    }

    // Check if the getDeployed function exists
    try {
      const result = await factory.getDeployed(getDeployerAddress(), getSaltHash(salt));
      return result;
    } catch (error: any) {
      if (error.code === 'BAD_DATA' || error.message.includes('could not decode result data')) {
        throw new Error(
          `The factory contract at ${factoryAddress} doesn't have the getDeployed method. ` +
          `This might be an old contract. Please deploy a new RomiFactory using the updated script.`
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error getting smart wallet address:', error);
    throw new Error(`Failed to get smart wallet address: ${error.message}`);
  }
}

export async function configureSmartWallet(address: string, signature: string, config: {
  token: string
  chainId: bigint
  nonce: bigint
}): Promise<void> {
  await fetch('/api/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      config: {
        token: config.token,
        chainId: config.chainId.toString(),
        nonce: config.nonce.toString(),
      },
      signature
    }),
  })
}

export async function deploySmartWallet(
  salt: string,
  user: string,
  signature: string,
  config: {
    token: string
    chainId: bigint
    nonce: bigint
  },
  ensName?: string
): Promise<{ address: string; ensName: string | null }> {
  const res = await fetch('/api/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: user,
      salt: salt,
      config: {
        token: config.token,
        chainId: config.chainId.toString(),
        nonce: config.nonce.toString(),
      },
      signature,
      ensName // Pass the ENS name to the API
    }),
  })

  const result = await res.json()

  return {
    address: result.deployed,
    ensName: result.ensName || null,
  }
}

// Helper function to check if the factory contract is compatible with ENS
export async function checkFactoryCompatibility(chainId: number): Promise<{
  isCompatible: boolean;
  hasL2Registrar: boolean;
  contractExists: boolean;
  error?: string;
}> {
  try {
    const provider = getRomiDefaultProvider(chainId);
    const factoryAddress = getFactoryAddress();

    // Check if contract exists
    const code = await provider.getCode(factoryAddress);
    if (code === '0x') {
      return {
        isCompatible: false,
        hasL2Registrar: false,
        contractExists: false,
        error: `No contract deployed at ${factoryAddress}`
      };
    }

    const factory = new ethers.Contract(factoryAddress, Create3FactoryArtifact.abi, provider);

    try {
      // Check if it has the new ENS methods
      const hasL2Registrar = await factory.hasL2Registrar();
      return {
        isCompatible: true,
        hasL2Registrar,
        contractExists: true
      };
    } catch (error: any) {
      return {
        isCompatible: false,
        hasL2Registrar: false,
        contractExists: true,
        error: `Contract exists but missing ENS methods: ${error.message}`
      };
    }
  } catch (error: any) {
    return {
      isCompatible: false,
      hasL2Registrar: false,
      contractExists: false,
      error: error.message
    };
  }
}
