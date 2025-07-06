"use client"
import { ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUp, ArrowUpRight, CheckCircle } from "lucide-react"
import { formatDate, getActivePreference } from "@/lib/utils"
import { usePrivy } from "@privy-io/react-auth"
import { useEffect, useState } from "react"
import { set } from "react-hook-form"


export function TxList() {
  const { user } = usePrivy()
  const [smartAccount, setSmartAccount] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[] | null>(null)

  useEffect(() => {
    if(!user || !user.wallet || !user.wallet.address) { 
      return
    }
    const activePreference = getActivePreference(user.wallet.address)
    console.log("Active preference:", activePreference)
    setSmartAccount(activePreference?.smartWalletAddress || null)
  }, [user])

  useEffect(() => {
    if (!smartAccount) {
      return
    }
    // Fetch transactions for the smart account
    fetch(`/api/activity?address=${smartAccount}`)
      .then((res) => res.json())
      .then(({data}) => {
        setTransactions(data)
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error)
      })
  }, [smartAccount])

  if(transactions === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ArrowUpRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No transactions yet</h3>
          <p className="text-gray-500">Your transaction history will appear here once you start using romi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 lg:p-6 border-b border-gray-100">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="divide-y divide-gray-100 max-h-[600px] lg:max-h-none overflow-y-auto">
        {transactions.map((tx) => (
          <div key={tx.transaction_id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                {/* Transaction Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-900">
                    <span>
                      {tx.from_value} {tx.from_token}
                    </span>
                    {tx.type === "swap" && <ArrowRight className="w-3 h-3 text-gray-400" />}
                    {tx.type === "swap" && <span>{tx.to_value} {tx.to_token}</span>}
                    <img
                  src={tx.chain_id === "optimism" ? "/blockchains/optimism.svg?height=32&width=32" : "/blockchains/base.svg?height=32&width=32"}
                  alt={tx.chain_id}
                  className="w-6 h-6 rounded-full"
                />
                    {/* <span> ~ $32</span> */}
                  </div>
                  <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                    <span>{tx.type.toUpperCase()}</span>
                    {tx.type === "swap" && <ArrowLeftRight className="w-2 h-2" />}
                    {tx.type === "send" && <ArrowRight className="w-2 h-2" />}
                    {tx.type === "receive" && <ArrowLeft className="w-2 h-2" />}
                    <span>•</span>
                    <span>{formatDate(tx.datetime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

