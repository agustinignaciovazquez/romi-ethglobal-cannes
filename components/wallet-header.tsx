"use client"

import { useRouter, usePathname } from "next/navigation"
import { LogOut, Wallet, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "./copy-button"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { formatAddress, clearWalletSetupData } from "@/lib/utils"

export function WalletHeader() {
  const { state, logout } = useWallet()
  const { logout: privyLogout, authenticated, user } = usePrivy()
  const router = useRouter()
  const pathname = usePathname()

  // Don't show header on connect page
  if (pathname === "/connect") {
    return null
  }

  const handleLogout = async () => {
    // Clear wallet-specific setup data if user is connected
    if (user?.wallet?.address) {
      const walletAddress = user.wallet.address.toLowerCase()
      clearWalletSetupData(walletAddress)
    }
    
    logout()
    await privyLogout()
    router.push("/connect")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="romi logo" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">romi</h1>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="flex items-center gap-3">
          {state.userWalletAddress ? (
            <>
              {/* Wallet Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {state.ensName || formatAddress(state.userWalletAddress)}
                </span>
                <CopyButton
                  text={state.ensName || state.userWalletAddress}
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                />
              </div>

              {/* Mobile wallet indicator */}
              <div className="sm:hidden flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Wallet className="w-4 h-4 text-gray-600" />
              </div>

              {/* Settings Button */}
              {state.hasSetup && (
                <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="hidden sm:flex">
                  <Settings className="w-4 h-4" />
                </Button>
              )}

              {/* Logout Button */}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-500">Not connected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
