import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Placeholder wallet utility functions
export async function connectWallet(): Promise<string> {
  // Simulate wallet connection delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock wallet address
  return "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4"
}

export async function getSmartWalletAddress(userAddress: string): Promise<string> {
  // Simulate smart wallet deployment
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Return mock smart wallet address
  return "0x123456789abcdef123456789abcdef123456789a"
}

export async function personalSign(message: string, address: string): Promise<string> {
  // Simulate personal sign
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return mock signature
  return "0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcdef"
}

export async function deploySmartWallet(userAddress: string): Promise<{ address: string; ensName: string }> {
  // Simulate smart wallet deployment and ENS assignment
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const smartWalletAddress = await getSmartWalletAddress(userAddress)
  const ensName = `user${Date.now()}.romi.eth`

  return {
    address: smartWalletAddress,
    ensName,
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
