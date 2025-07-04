import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WalletSetupMap, WalletSetupData, UserPreferences } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Privy-based wallet utility functions
export async function connectWallet(): Promise<string> {
  // This will be called from the component that has access to Privy hooks
  // For now, return a placeholder - the actual connection will be handled by Privy
  throw new Error("Use Privy hooks for wallet connection")
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

// Wallet setup map utilities
const WALLET_SETUP_STORAGE_KEY = "romi-wallet-setups"

export function getWalletSetupMap(): WalletSetupMap {
  try {
    const stored = localStorage.getItem(WALLET_SETUP_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Failed to parse wallet setup map:", error)
    return {}
  }
}

export function setWalletSetupMap(setupMap: WalletSetupMap): void {
  try {
    localStorage.setItem(WALLET_SETUP_STORAGE_KEY, JSON.stringify(setupMap))
  } catch (error) {
    console.error("Failed to save wallet setup map:", error)
  }
}

export function getWalletSetupData(walletAddress: string): WalletSetupData | null {
  const setupMap = getWalletSetupMap()
  return setupMap[walletAddress.toLowerCase()] || null
}

export function saveWalletSetupData(walletAddress: string, setupData: WalletSetupData): void {
  const setupMap = getWalletSetupMap()
  setupMap[walletAddress.toLowerCase()] = setupData
  setWalletSetupMap(setupMap)
}

export function addUserPreference(
  walletAddress: string, 
  preference: Omit<UserPreferences, 'id' | 'createdAt'>
): UserPreferences {
  const setupData = getWalletSetupData(walletAddress) || { 
    preferences: [], 
    lastActivePreferenceId: null 
  }
  
  const newPreference: UserPreferences = {
    ...preference,
    id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  }
  
  setupData.preferences.push(newPreference)
  setupData.lastActivePreferenceId = newPreference.id
  
  saveWalletSetupData(walletAddress, setupData)
  return newPreference
}

export function getActivePreference(walletAddress: string): UserPreferences | null {
  const setupData = getWalletSetupData(walletAddress)
  if (!setupData || setupData.preferences.length === 0) {
    return null
  }
  
  // Return the last active preference or the most recent one
  if (setupData.lastActivePreferenceId) {
    const activePreference = setupData.preferences.find(p => p.id === setupData.lastActivePreferenceId)
    if (activePreference) {
      return activePreference
    }
  }
  
  // Fallback to the most recent preference
  return setupData.preferences[setupData.preferences.length - 1]
}

export function setActivePreference(walletAddress: string, preferenceId: string): void {
  const setupData = getWalletSetupData(walletAddress)
  if (setupData && setupData.preferences.find(p => p.id === preferenceId)) {
    setupData.lastActivePreferenceId = preferenceId
    saveWalletSetupData(walletAddress, setupData)
  }
}

export function hasWalletSetup(walletAddress: string): boolean {
  const setupData = getWalletSetupData(walletAddress)
  return setupData ? setupData.preferences.length > 0 : false
}

export function clearWalletSetupData(walletAddress: string): void {
  const setupMap = getWalletSetupMap()
  delete setupMap[walletAddress.toLowerCase()]
  setWalletSetupMap(setupMap)
}

export function getAllWalletSetups(): { address: string; data: WalletSetupData }[] {
  const setupMap = getWalletSetupMap()
  return Object.entries(setupMap).map(([address, data]) => ({ address, data }))
}

export function getWalletSetupSummary(walletAddress: string): string {
  const setupData = getWalletSetupData(walletAddress)
  if (!setupData || setupData.preferences.length === 0) return "No setup data found"
  
  const activePreference = getActivePreference(walletAddress)
  return `Setup: ${setupData.preferences.length} preference(s), Active: ${activePreference?.ensName || "None"}, Smart Wallet: ${activePreference?.smartWalletAddress || "None"}`
}
