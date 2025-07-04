"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { hasWalletSetup, getActivePreference } from "@/lib/utils"

export default function HomePage() {
  const router = useRouter()
  const { state, connectWallet, setHasSetup, addPreference } = useWallet()
  const { authenticated, user, ready } = usePrivy()
  const [isLoading, setIsLoading] = useState(true)

  // Wait for Privy to be ready
  useEffect(() => {
    if (ready) {
      setIsLoading(false)
    }
  }, [ready])

  useEffect(() => {
    if (!ready) return

    // If not authenticated, go to connect page
    if (!authenticated) {
      router.push("/connect")
      return
    }

    // If authenticated and has wallet address
    if (authenticated && user?.wallet?.address) {
      const walletAddress = user.wallet.address.toLowerCase()

      // Connect wallet in context if not already connected
      if (!state.userWalletAddress) {
        connectWallet(user.wallet.address)
      }

      // Check setup status
      const hasSetup = hasWalletSetup(walletAddress)

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

      // Route based on setup status
      if (hasSetup) {
        router.push("/dashboard")
      } else {
        router.push("/setup")
      }
    }
  }, [ready, authenticated, user?.wallet?.address, state.userWalletAddress, state.hasSetup, state.preferences.length, router, connectWallet, setHasSetup, addPreference])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
