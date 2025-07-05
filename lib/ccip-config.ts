// CCIP Router addresses for different chains
// Official Chainlink CCIP Router addresses as of 2024

export const CCIP_ROUTER_ADDRESSES = {
  // Ethereum Mainnet
  1: "0x80226fc0ee2b096224eeac085bb9a8cba1146f7d",
  
  // Ethereum Sepolia Testnet
  11155111: "0x0bf3de8c5d3e8a2b34d2beeb17abfcebaf363a59",
  
  // Polygon Mainnet
  137: "0x3c3d92629a02a8d95d5cb9650fe49c3544f69b43",
  
  // Polygon Mumbai Testnet (Deprecated - use Amoy)
  80001: "0x1035cabc275068e0f4b745a29cedf38e13af41b1",
  
  // Polygon Amoy Testnet
  80002: "0x9c32fce489cf0fbf23e4f4283bd0b0a87e5f3e6b",
  
  // BSC Mainnet
  56: "0x34b03cb9086d7d758ac55af71584f81a598759fd",
  
  // BSC Testnet
  97: "0xe1053ae1857476f36a3c62580ff9b016e8ee8f6f",
  
  // Avalanche Mainnet
  43114: "0xf4c7e640edA248ef95972845a62bdC74237805dB",
  
  // Avalanche Fuji Testnet
  43113: "0xf694e193200268f9a4868e4aa017a0118c9a8177",
  
  // Arbitrum One
  42161: "0x141fa059441e0ca23ce184b6a78bafe2a7b70977",
  
  // Arbitrum Sepolia Testnet
  421614: "0x2a9c5afb0d0e4bab2bcdae109ec4b0c4be15a165",
  
  // Optimism Mainnet
  10: "0x3206695caea682fee4e7129862c6c3dab2c1192b",
  
  // Optimism Sepolia Testnet
  11155420: "0x114a20a10b43d4115e5aeef7345a1a71d2a60c57",
  
  // Base Mainnet
  8453: "0x673aa85efd75080031d44fce061575d1da427a28",
  
  // Base Sepolia Testnet
  84532: "0xd3b06ca5c1eadf11c1ccaaa648c0c93b8e8ed2cd",
} as const;

export const ONE_INCH_ROUTER_ADDRESSES = {
  // Ethereum Mainnet
  1: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Ethereum Sepolia Testnet
  11155111: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Polygon Mainnet
  137: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Polygon Amoy Testnet
  80002: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // BSC Mainnet
  56: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // BSC Testnet
  97: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Avalanche Mainnet
  43114: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Avalanche Fuji Testnet
  43113: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Arbitrum One
  42161: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Arbitrum Sepolia Testnet
  421614: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Optimism Mainnet
  10: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Optimism Sepolia Testnet
  11155420: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Base Mainnet
  8453: "0x111111125421ca6dc452d289314280a0f8842a65",
  
  // Base Sepolia Testnet
  84532: "0x111111125421ca6dc452d289314280a0f8842a65",
} as const;

// CCIP Chain Selectors (used for cross-chain messaging)
export const CCIP_CHAIN_SELECTORS = {
  // Ethereum Mainnet
  1: "5009297550715157269",
  
  // Ethereum Sepolia Testnet
  11155111: "16015286601757825753",
  
  // Polygon Mainnet
  137: "4051577828743386545",
  
  // Polygon Amoy Testnet
  80002: "16281711391670634445",
  
  // BSC Mainnet
  56: "11344663589394136015",
  
  // BSC Testnet
  97: "13264668187771770619",
  
  // Avalanche Mainnet
  43114: "6433500567565415381",
  
  // Avalanche Fuji Testnet
  43113: "14767482510784806043",
  
  // Arbitrum One
  42161: "4949039107694359620",
  
  // Arbitrum Sepolia Testnet
  421614: "3478487238524512106",
  
  // Optimism Mainnet
  10: "3734403246176062136",
  
  // Optimism Sepolia Testnet
  11155420: "5224473277236331295",
  
  // Base Mainnet
  8453: "15971525489660198786",
  
  // Base Sepolia Testnet
  84532: "10344971235874465080",
} as const;

export type SupportedChainId = keyof typeof CCIP_ROUTER_ADDRESSES;
export type OneInchSupportedChainId = keyof typeof ONE_INCH_ROUTER_ADDRESSES;
export type CCIPSelectorChainId = keyof typeof CCIP_CHAIN_SELECTORS;

export function getCCIPRouterAddress(chainId: number): string {
  const address = CCIP_ROUTER_ADDRESSES[chainId as SupportedChainId];
  if (!address) {
    throw new Error(`CCIP Router not supported on chain ${chainId}`);
  }
  return address;
}

export function getOneInchRouterAddress(chainId: number): string {
  const address = ONE_INCH_ROUTER_ADDRESSES[chainId as OneInchSupportedChainId];
  if (!address) {
    throw new Error(`1inch Router not supported on chain ${chainId}`);
  }
  return address;
}

export function getCCIPChainSelector(chainId: number): string {
  const selector = CCIP_CHAIN_SELECTORS[chainId as CCIPSelectorChainId];
  if (!selector) {
    throw new Error(`CCIP Chain Selector not found for chain ${chainId}`);
  }
  return selector;
}
