import { TypedDataDomain } from 'ethers'

export async function signSmartAccountConfig(
  signer: any,
  config: {
    preferredToken: string
    destinationChainSelector: bigint
    destinationWallet: string
    nonce: bigint
  },
  smartAccountAddress: string,
  chainId: number
): Promise<string> {
  const domain: TypedDataDomain = {
    name: "SmartAccount",
    version: "1",
    chainId,
    verifyingContract: smartAccountAddress,
  }

  const types = {
    Config: [
      { name: "preferredToken", type: "address" },
      { name: "destinationChainSelector", type: "uint64" },
      { name: "destinationWallet", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
  }

  return signer.signTypedData(domain, types, config)
}