"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/dropdown-select"
import { useWallet } from "@/contexts/wallet-context"
import { tokens, chains } from "@/lib/data"
import type { Token, Chain } from "@/types"
import { personalSign, deploySmartWallet } from "@/lib/utils"

export default function SetupPage() {
  const [selectedToken, setSelectedToken] = useState<Token | undefined>()
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>()
  const [isDeploying, setIsDeploying] = useState(false)
  const { state, setPreferences, setSmartWallet, setHasSetup } = useWallet()
  const router = useRouter()

  const handleContinue = async () => {
    if (!selectedToken || !selectedChain || !state.userWalletAddress) return

    setIsDeploying(true)
    try {
      // Step 1: Personal sign for verification
      await personalSign("Setup romi wallet", state.userWalletAddress)

      // Step 2: Deploy smart wallet and assign ENS
      const { address, ensName } = await deploySmartWallet(state.userWalletAddress)

      // Step 3: Save preferences and wallet info
      setPreferences({ selectedToken, selectedChain })
      setSmartWallet(address, ensName)
      setHasSetup(true)

      // Step 4: Route to deposit page
      router.push("/deposit")
    } catch (error) {
      console.error("Setup failed:", error)
    } finally {
      setIsDeploying(false)
    }
  }

  const canContinue = selectedToken && selectedChain && !isDeploying

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
