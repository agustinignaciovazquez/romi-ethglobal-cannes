"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownSelect } from "@/components/dropdown-select"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { tokens, chains } from "@/lib/data"
import type { Token, Chain } from "@/types"
import { hasWalletSetup, addUserPreference } from "@/lib/utils"
import { deploySmartWallet, getSmartWalletAddress, signSmartAccountConfig } from "../../lib/romi"
import { useSigner } from "../../hooks/use-signer"
import { useEnsAvailability } from "../../hooks/use-ens-availability"
import { randomBytes } from "crypto"

export default function SetupPage() {
  const [selectedToken, setSelectedToken] = useState<Token | undefined>()
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { state, addPreference, setHasSetup, connectWallet } = useWallet()
  const { wallets } = useWallets()
  const { authenticated, user, ready } = usePrivy()
  const router = useRouter()
  const { signer, isLoading: isSignerLoading, error: signerError } = useSigner(wallets?.[0])
  const { isChecking: isCheckingEns, isAvailable: ensAvailable, error: ensError, checkAvailability: checkEnsAvailability } = useEnsAvailability()

  const [ensSubdomain, setEnsSubdomain] = useState("")

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

  // Debounce the ENS check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ensSubdomain) {
        checkEnsAvailability(ensSubdomain)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [ensSubdomain, checkEnsAvailability])

  // Generate random subdomain
  const generateSubdomain = () => {
    const adjectives = ["swift", "bright", "cool", "smart", "quick", "bold", "calm", "wise", "pure", "free"]
    const nouns = ["fox", "wolf", "eagle", "lion", "bear", "hawk", "star", "moon", "sun", "wave"]
    const numbers = Math.floor(Math.random() * 999) + 1

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]

    const generated = `${adjective}${noun}${numbers}`
    setEnsSubdomain(generated)
  }

  const handleContinue = async () => {
    if (!selectedToken || !selectedChain || !state.userWalletAddress || !user?.wallet?.address || !signer) return

    setIsDeploying(true)
    try {
      const config = {
        token: selectedToken.contractAddress(selectedChain.chainId),
        chainId: BigInt(selectedChain.chainId),
        nonce: BigInt(0),
      }

      const salt = randomBytes(32).toString("hex") // Generate a random salt
      console.log("Generated salt:", salt)

      const sig = await signSmartAccountConfig(signer, config, await getSmartWalletAddress(salt))

      // Step 2: Deploy smart wallet and assign ENS (pass the user's chosen ENS subdomain)
      const { address, ensName } = await deploySmartWallet(salt, state.userWalletAddress, sig, config, ensSubdomain)

      // Step 3: Create new preference with all setup data
      const newPreference = addUserPreference(user.wallet.address, {
        selectedToken,
        selectedChain,
        selectedTokenAddress: selectedToken.contractAddress(selectedChain.chainId),
        smartWalletAddress: address,
        ensName: ensName ?? "",
        setupSignature: sig,
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

  const canContinue = selectedToken && selectedChain && !isDeploying && signer && !isSignerLoading

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

  // Show error if signer failed to load
  if (signerError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Wallet Connection Error</h1>
            <p className="text-gray-600">{signerError}</p>
          </div>
          <Button onClick={() => router.push("/connect")} className="w-full">
            Try Again
          </Button>
        </div>
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
          <p>
            We'll create your smart wallet at {ensSubdomain ? `${ensSubdomain}.toromi.eth` : "your-name.toromi.eth"}
          </p>
          <p>This process may take a few moments</p>
        </div>
      </div>
    </div>
  )
}
