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

export async function getSmartWalletAddress(salt: string): Promise<string> {
  const provider =  getRomiDefaultProvider();
  const factory = new ethers.Contract(getFactoryAddress(), Create3FactoryArtifact.abi, provider)
  return await factory.getDeployed(getDeployerAddress(), getSaltHash(salt))
}

export async function deploySmartWallet(salt: string, user: string, signature: string, config: {
  token: string
  chainId: bigint
  nonce: bigint
}): Promise<{ address: string; ensName: string }> {
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
      signature 
    }),
  })

  const ensName = `user${Date.now()}.romi.eth`

  return {
    address: await res.json().then(data => data.deployed),
    ensName,
  }
}