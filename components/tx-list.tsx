"use client"
import { ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react"
import type { Transaction } from "@/types"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TxListProps {
  transactions: Transaction[]
}

export function TxList({ transactions }: TxListProps) {
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
          <div key={tx.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {tx.status === "Successful" && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {tx.status === "Pending" && <Clock className="w-5 h-5 text-yellow-500" />}
                  {tx.status === "Failed" && <XCircle className="w-5 h-5 text-red-500" />}
                </div>

                {/* Transaction Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-900">
                    <span>
                      {tx.amount} {tx.fromToken}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                    <span>{tx.toToken}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                    <span>{tx.fromChain}</span>
                    <ArrowUpRight className="w-2 h-2" />
                    <span>{tx.toChain}</span>
                    <span>•</span>
                    <span>{formatDate(tx.date)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 lg:gap-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    tx.status === "Successful"
                      ? "bg-green-100 text-green-700"
                      : tx.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {tx.status}
                </span>

                {tx.status === "Successful" && (
                  <Button variant="ghost" size="sm" className="text-xs lg:text-sm">
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
