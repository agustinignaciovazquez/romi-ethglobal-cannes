"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectWallet, state } = useWallet()
  const { login, authenticated, user } = usePrivy()
  const router = useRouter()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      connectWallet(user.wallet.address)
      if (state.hasSetup) {
        router.push("/dashboard")
      } else {
        router.push("/setup")
      }
    }
  }, [authenticated, user, connectWallet, state.hasSetup, router])

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">romi</h1>
            <p className="text-gray-600 font-medium">All roads lead to romi</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">multichain deposits made simple</h2>
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
