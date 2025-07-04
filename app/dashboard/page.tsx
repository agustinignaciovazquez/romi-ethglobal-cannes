"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus, TrendingUp, ArrowUpRight, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BalanceHeader } from "@/components/balance-header"
import { TxList } from "@/components/tx-list"
import { useWallet } from "@/contexts/wallet-context"
import { usePrivy } from "@privy-io/react-auth"
import { hasWalletSetup, getActivePreference } from "@/lib/utils"

export default function DashboardPage() {
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

  // Check authentication and setup wallet context
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

      // Check setup status
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
  }, [ready, authenticated, user?.wallet?.address, router, state.userWalletAddress, state.hasSetup, state.preferences.length, connectWallet, setHasSetup, addPreference])

  // Show loading while Privy is initializing or checking setup
  if (isLoading || !ready || !authenticated || !state.userWalletAddress || !state.hasSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 lg:p-8">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Balance and Quick Actions */}
            <div className="col-span-4 space-y-6">
              <BalanceHeader />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => router.push("/deposit")}
                    className="w-full h-12 justify-start gap-3"
                    variant="outline"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Deposit Tokens</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/settings")}
                    className="w-full h-12 justify-start gap-3"
                    variant="outline"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Wallet Settings</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Transactions</p>
                        <p className="text-2xl font-bold">{state.transactions.length}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Successful Transfers</p>
                        <p className="text-2xl font-bold">
                          {state.transactions.filter((tx) => tx.status === "Successful").length}
                        </p>
                      </div>
                      <ArrowUpRight className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Transaction History */}
            <div className="col-span-8">
              <TxList transactions={state.transactions} />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
          <BalanceHeader />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 flex items-center gap-2 bg-transparent"
              onClick={() => router.push("/deposit")}
            >
              <Plus className="w-4 h-4" />
              <span>Deposit</span>
            </Button>
            <Button
              variant="outline"
              className="h-12 flex items-center gap-2 bg-transparent"
              onClick={() => router.push("/settings")}
            >
              <Wallet className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>

          {/* Transaction List */}
          <TxList transactions={state.transactions} />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-1">
        </div>
      </div>
    </div>
  )
}
