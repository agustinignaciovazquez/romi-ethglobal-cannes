"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { hasWalletSetup, getActivePreference } from "@/lib/utils"

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { connectWallet, state, setHasSetup, addPreference } = useWallet()
  const { login, authenticated, user, ready } = usePrivy()
  const router = useRouter()

  // Wait for Privy to be ready and check authentication status
  useEffect(() => {
    if (ready) {
      setIsLoading(false)
    }
  }, [ready])

  // Check setup status and update context
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      const walletAddress = user.wallet.address.toLowerCase()

      // Connect wallet in context if not already connected
      if (!state.userWalletAddress) {
        connectWallet(user.wallet.address)
      }

      const hasSetup = hasWalletSetup(walletAddress)

      if (hasSetup !== state.hasSetup) {
        setHasSetup(hasSetup)
      }

      // Load active preference if exists and not already loaded
      if (hasSetup && state.preferences.length === 0) {
        const activePreference = getActivePreference(walletAddress)
        if (activePreference) {
          // Load preferences from storage into state
          addPreference(activePreference)
        }
      }
    }
  }, [authenticated, user?.wallet?.address, state.userWalletAddress, setHasSetup, state.hasSetup, state.preferences.length, addPreference, connectWallet])

  // Redirect based on authentication and setup status
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      connectWallet(user.wallet.address)

      // Check if user has completed setup for this specific wallet
      const walletAddress = user.wallet.address.toLowerCase()
      const hasSetup = hasWalletSetup(walletAddress)

      if (hasSetup) {
        router.push("/dashboard")
      } else {
        router.push("/setup")
      }
    }
  }, [authenticated, user?.wallet?.address, router])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await login()
      // The useEffect above will handle routing after successful login
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  // Show loading while Privy is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-white-500 to-white-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Image
              src="/logo.png"
              alt="Romi Logo"
              width={86}
              height={86}
              className="w-full h-full"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Romi</h1>
            <p className="text-gray-600 font-medium">All chains lead to Romi</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Multichain deposits made simple</h2>
          <p className="text-gray-600 leading-relaxed">
            Connect your wallet to get started with seamless cross-chain token transfers. <br /> No gas fees to worry about, no
            complex bridging.
          </p>
        </div>

        {/* Connect Button */}
        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            {isConnecting ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </div>
            )}
          </Button>

          <p className="text-xs text-gray-500">By connecting, you agree to our terms of service and privacy policy</p>
        </div>
      </div>
    </div>
  )
}
