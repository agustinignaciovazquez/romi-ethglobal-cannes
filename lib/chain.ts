import { ethers } from "ethers"

export function getDefaultRpcUrl(): string {
  if (!process.env.NEXT_PUBLIC_DEFAULT_RPC) {
    throw new Error("Default RPC URL is not set in environment variables")
  }
  return process.env.NEXT_PUBLIC_DEFAULT_RPC
}

export function getRomiDefaultProvider() {
    return new ethers.JsonRpcProvider(getDefaultRpcUrl())
}

export function getDeployerAddress(): string {
  if (!process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS) {
    throw new Error("Deployer address is not set in environment variables")
  }
  return process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS
}   