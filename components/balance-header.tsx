"use client"
import { useWallet } from "@/contexts/wallet-context"
import { CopyButton } from "./copy-button"
import { addUserPreference, formatAddress, getActivePreference } from "@/lib/utils"
import { useEffect, useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { UserPreferences } from "../types"

export function BalanceHeader() {
  const { state } = useWallet()
  const { user } = usePrivy()

  const [activePreference, setActivePreference] = useState<UserPreferences | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  // Get the active preference (the most recent one or the one that matches current state)

    useEffect(() => {
      if(!user || !user.wallet || !user.wallet.address) { 
        return
      }
      const activePreference = getActivePreference(user.wallet.address)
      
      setActivePreference(activePreference)
      console.log("Active preference:", activePreference)
    }, [user])
  
    useEffect(() => {
      if (!activePreference) {
        return
      }
      // Fetch transactions for the smart account
      fetch(`/api/balance?address=${activePreference.smartWalletAddress}&token=${activePreference.selectedTokenAddress}&chain=${activePreference?.selectedChain.name}`)
        .then((res) => res.json())
        .then(({amount}) => {
          setBalance(amount)
        })
        .catch((error) => {
          console.error("Error fetching transactions:", error)
        })
    }, [activePreference])


  if(balance === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="text-center space-y-4">
        {/* ENS or Address */}
        <div className="flex flex-col items-center justify-center gap-1">
          {state.ensName && (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {state.ensName}
              </h2>
              <CopyButton
                text={state.ensName}
                className="text-gray-500 hover:text-gray-700"
              />
            </div>
          )}
          {state.smartWalletAddress && (
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-mono text-gray-700">
                {formatAddress(state.smartWalletAddress)}
              </h5>
              <CopyButton
                text={state.smartWalletAddress}
                className="text-gray-500 hover:text-gray-700"
              />
            </div>
          )}
        </div>

        {/* Total Balance */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 font-medium">Total Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {balance && balance.toString().substring(0, 8)}
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
