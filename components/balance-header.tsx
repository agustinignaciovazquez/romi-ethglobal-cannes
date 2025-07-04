"use client"
import { useWallet } from "@/contexts/wallet-context"
import { CopyButton } from "./copy-button"
import { formatAddress } from "@/lib/utils"

export function BalanceHeader() {
  const { state } = useWallet()
  
  // Get the active preference (the most recent one or the one that matches current state)
  const activePreference = state.preferences.length > 0 ? state.preferences[state.preferences.length - 1] : null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-center space-y-4">
        {/* ENS or Address */}
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {state.ensName || (state.smartWalletAddress ? formatAddress(state.smartWalletAddress) : "No Wallet")}
          </h2>
          {(state.ensName || state.smartWalletAddress) && (
            <CopyButton
              text={state.ensName || state.smartWalletAddress || ""}
              className="text-gray-500 hover:text-gray-700"
            />
          )}
        </div>

        {/* Total Balance */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Total Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            ${state.totalBalance}
            {activePreference && (
              <span className="text-lg font-normal text-gray-500 ml-2">{activePreference.selectedToken.name}</span>
            )}
          </p>
        </div>

        {/* Destination Chain */}
        {activePreference && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <img
              src={activePreference.selectedChain.imageUrl || "/placeholder.svg"}
              alt={activePreference.selectedChain.name}
              className="w-4 h-4 rounded-full"
            />
            <span>on {activePreference.selectedChain.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
