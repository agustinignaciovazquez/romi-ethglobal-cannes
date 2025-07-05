import { ethers } from "ethers"
import config from "./config"

export function getDefaultRpcUrl(): string {
  const rpcUrl = config.defaultRpc;
  
  if (!rpcUrl) {
    console.error("Default RPC URL is not available in config")
    throw new Error("Default RPC URL is not set in configuration")
  }
  
  console.log("Using default RPC URL:", rpcUrl)
  return rpcUrl
}

// Debug function to help troubleshoot environment variables
export function debugEnvironment() {
  console.log("=== Environment Debug Info ===")
  console.log("typeof process:", typeof process)
  console.log("process.env exists:", !!process?.env)
  
  if (typeof process !== 'undefined' && process.env) {
    console.log("All NEXT_PUBLIC_ variables:")
    Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .forEach(key => {
        console.log(`  ${key}:`, process.env[key])
      })
    
    console.log("All process.env keys count:", Object.keys(process.env).length)
    console.log("First 10 env keys:", Object.keys(process.env).slice(0, 10))
  } else {
    console.log("process.env is not available (likely running in browser)")
  }
  
  console.log("Is browser:", typeof window !== 'undefined')
  console.log("Is server:", typeof window === 'undefined')
  console.log("==============================")
}

export function getRomiDefaultProvider(chainId?: number): ethers.JsonRpcProvider {
  // Add debug info
  debugEnvironment()
  
  if (!chainId) {
    return new ethers.JsonRpcProvider(getDefaultRpcUrl())
  }
  
  const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
  console.log(`Looking for RPC URL for chain ${chainId}`)
  console.log(`Found value:`, rpcUrl)
  
  if (!rpcUrl) {
    console.log("Available RPC URLs in config:")
    Object.entries(config.rpcUrls).forEach(([chain, url]) => {
      console.log(`  Chain ${chain}: ${url}`)
    })
    throw new Error(`RPC URL for chain ${chainId} is not available in configuration`)
  }
  return new ethers.JsonRpcProvider(rpcUrl)
}

export function getDeployerAddress(): string {
  const deployerAddress = config.deployerAddress;
  
  if (!deployerAddress) {
    console.error("Deployer address is not available in config")
    throw new Error("Deployer address is not set in configuration")
  }
  
  console.log("Using deployer address:", deployerAddress)
  return deployerAddress
}
