"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Info, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { formatAddress, getActivePreference, hasWalletSetup } from "@/lib/utils"

export default function DepositPage() {
  const { state, connectWallet, setHasSetup, addPreference } = useWallet()
  const { authenticated, user, ready } = usePrivy()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Wait for Privy to be ready
  useEffect(() => {
    if (ready) {
      setIsLoading(false)
    }
  }, [ready])

  // Check authentication and setup
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/connect")
      return
    }

    if (authenticated && user?.wallet?.address) {
      const walletAddress = user.wallet.address.toLowerCase()

      // Connect wallet in context if not already connected
      if (!state.userWalletAddress) {
        connectWallet(user.wallet.address)
      }

      const hasSetup = hasWalletSetup(walletAddress)
      if (!hasSetup) {
        router.push("/setup")
        return
      }

      // Update setup status in context
      if (hasSetup !== state.hasSetup) {
        setHasSetup(hasSetup)
      }

      // Load active preference if exists and not already loaded
      if (hasSetup && state.preferences.length === 0) {
        const activePreference = getActivePreference(walletAddress)
        if (activePreference) {
          addPreference(activePreference)
        }
      }
    }
  }, [ready, authenticated, user?.wallet?.address, state.userWalletAddress, state.hasSetup, state.preferences.length, router, connectWallet, setHasSetup, addPreference])

  // Get the active preference
  const activePreference = user?.wallet?.address ? getActivePreference(user.wallet.address) : null

  // Show loading while checking authentication and setup
  if (isLoading || !ready || !authenticated || !state.userWalletAddress || !state.hasSetup || !activePreference || !state.smartWalletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Your Romi wallet is ready!</h1>
          <p className="text-gray-600">
            Send any token to this address and we'll handle the rest.
          </p>
        </div>

        {/* Wallet Address Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          {/* ENS/Address Display */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Your Romi wallet</p>
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-gray-900 break-all">
                    {state.ensName || formatAddress(state.smartWalletAddress)}
                  </span>
                  <CopyButton text={state.ensName || state.smartWalletAddress} variant="outline" size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Deposit any token here — we'll handle swapping to {activePreference.selectedToken.name} and bridging to{" "}
                    {activePreference.selectedChain.name}.
                  </p>
                  <p className="text-xs text-blue-700">
                    This wallet is where you can send any tokens and they will be swapped and bridged automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Destination Summary */}
            <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-xl">
              <img
                src={activePreference.selectedToken.imageUrl || "/placeholder.svg"}
                alt={activePreference.selectedToken.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900">{activePreference.selectedToken.name}</span>
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <img
                src={activePreference.selectedChain.imageUrl || "/placeholder.svg"}
                alt={activePreference.selectedChain.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900">{activePreference.selectedChain.name}</span>
            </div>
          </div>

          {/* Continue Button */}
          <Button onClick={() => router.push("/dashboard")} className="w-full h-12 text-base font-semibold">
            Go to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Need help? Check our FAQ or contact support</p>
          <p>Your funds are secured by smart contract technology</p>
        </div>
      </div>
    </div>
  )
}
