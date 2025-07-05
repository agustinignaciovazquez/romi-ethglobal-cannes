import { TypedDataDomain } from 'ethers'

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
    name: "SmartAccount",
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