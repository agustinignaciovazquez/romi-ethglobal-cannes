// Environment configuration with fallbacks
const config = {
  // Chain RPC URLs
  rpcUrls: {
    31337: process.env.NEXT_PUBLIC_31337_RPC_URL || "http://localhost:8545",
    8453: process.env.NEXT_PUBLIC_8453_RPC_URL || "https://base-mainnet.g.alchemy.com/v2/FoJt2rHRvvLyCAn0_guG3",
    84532: process.env.NEXT_PUBLIC_84532_RPC_URL || "https://morning-solitary-pool.base-sepolia.quiknode.pro/1b1c93a856f37f87a6c5fb29f385f42dd0a7e18d"
  },
  
  // Contract addresses
  factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0xC751203e7d6614f16E2e2c5E963272f73721497c",
  deployerAddress: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || "0x008297ffc2a727357C2EdB420c2909983D2427Cd",
  
  // Default RPC
  defaultRpc: process.env.NEXT_PUBLIC_DEFAULT_RPC || "https://base-mainnet.g.alchemy.com/v2/FoJt2rHRvvLyCAn0_guG3",
  
  // Privy
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmcp8ctin01sck00l0yhwivu6"
};

// Debug logging
console.log("Config loaded:", {
  hasRpcUrls: Object.keys(config.rpcUrls).length > 0,
  factoryAddress: config.factoryAddress,
  deployerAddress: config.deployerAddress,
  defaultRpc: config.defaultRpc
});

export default config;
