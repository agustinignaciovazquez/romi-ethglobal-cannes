"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/dropdown-select"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { tokens, chains } from "@/lib/data"
import type { Token, Chain } from "@/types"
import { personalSign, deploySmartWallet, hasWalletSetup, addUserPreference } from "@/lib/utils"

export default function SetupPage() {
  const [selectedToken, setSelectedToken] = useState<Token | undefined>()
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { state, addPreference, setHasSetup, connectWallet } = useWallet()
  const { authenticated, user, ready } = usePrivy()
  const router = useRouter()

  // Wait for Privy to be ready
  useEffect(() => {
    if (ready) {
      setIsLoading(false)
    }
  }, [ready])

  // Redirect to connect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/connect")
      return
    }
  }, [ready, authenticated, router])

  // Check wallet connection and setup status
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      const walletAddress = user.wallet.address.toLowerCase()

      // Connect wallet in context if not already connected
      if (!state.userWalletAddress) {
        connectWallet(user.wallet.address)
      }

      const hasSetup = hasWalletSetup(walletAddress)
      if (hasSetup) {
        router.push("/dashboard")
      }
    }
  }, [authenticated, user?.wallet?.address, state.userWalletAddress, router, connectWallet])

  const handleContinue = async () => {
    if (!selectedToken || !selectedChain || !state.userWalletAddress || !user?.wallet?.address) return

    setIsDeploying(true)
    try {
      // Step 1: Personal sign for verification
      const signature = await personalSign("Setup romi wallet", state.userWalletAddress)

      // Step 2: Deploy smart wallet and assign ENS
      const { address, ensName } = await deploySmartWallet(state.userWalletAddress)

      // Step 3: Create new preference with all setup data
      const newPreference = addUserPreference(user.wallet.address, {
        selectedToken,
        selectedChain,
        smartWalletAddress: address,
        ensName,
        setupSignature: signature,
      })

      // Step 4: Add preference to context and mark as setup
      addPreference(newPreference)
      setHasSetup(true)

      // Step 5: Route to deposit page
      router.push("/deposit")
    } catch (error) {
      console.error("Setup failed:", error)
    } finally {
      setIsDeploying(false)
    }
  }

  const canContinue = selectedToken && selectedChain && !isDeploying

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (!authenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Set up your preferences</h1>
          <p className="text-gray-600">
            Choose your preferred token and destination chain. You can change these later.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          {/* Token Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">Preferred Token</label>
            <DropdownSelect
              items={tokens}
              value={selectedToken}
              onSelect={setSelectedToken}
              placeholder="Select a token"
              getLabel={(token) => token.name}
              getImage={(token) => token.imageUrl}
            />
            <p className="text-xs text-gray-500">This is the token you'll primarily receive and hold</p>
          </div>

          {/* Chain Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">Destination Chain</label>
            <DropdownSelect
              items={chains}
              value={selectedChain}
              onSelect={setSelectedChain}
              placeholder="Select a chain"
              getLabel={(chain) => chain.name}
              getImage={(chain) => chain.imageUrl}
            />
            <p className="text-xs text-gray-500">All tokens will be bridged to this chain automatically</p>
          </div>

          {/* Continue Button */}
          <Button onClick={handleContinue} disabled={!canContinue} className="w-full h-12 text-base font-semibold">
            {isDeploying ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Setting up your wallet...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>We'll create a smart wallet and assign you a romi.eth name</p>
          <p>This process may take a few moments</p>
        </div>
      </div>
    </div>
  )
}
