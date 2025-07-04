"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/dropdown-select"
import { useWallet } from "@/contexts/wallet-context"
import { tokens, chains } from "@/lib/data"
import type { Token, Chain } from "@/types"

export default function SettingsPage() {
  const { state, setPreferences } = useWallet()
  const router = useRouter()

  const [selectedToken, setSelectedToken] = useState<Token | undefined>(state.preferences?.selectedToken)
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>(state.preferences?.selectedChain)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedToken || !selectedChain) return

    setIsSaving(true)
    try {
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPreferences({ selectedToken, selectedChain })
      router.push("/deposit")
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    selectedToken !== state.preferences?.selectedToken || selectedChain !== state.preferences?.selectedChain

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Update your preferences</p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          {/* Warning */}
          {hasChanges && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900">
                    This changes your bridging destination, not your wallet address.
                  </p>
                  <p className="text-xs text-yellow-700">Future deposits will be bridged to your new preferences.</p>
                </div>
              </div>
            </div>
          )}

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
          </div>

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
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !selectedToken || !selectedChain || isSaving}
            className="w-full h-12 text-base font-semibold"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </div>
            )}
          </Button>
        </div>

        {/* Current Settings Display */}
        {state.preferences && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Token:</span>
                <div className="flex items-center gap-2">
                  <img
                    src={state.preferences.selectedToken.imageUrl || "/placeholder.svg"}
                    alt={state.preferences.selectedToken.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="font-medium">{state.preferences.selectedToken.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Chain:</span>
                <div className="flex items-center gap-2">
                  <img
                    src={state.preferences.selectedChain.imageUrl || "/placeholder.svg"}
                    alt={state.preferences.selectedChain.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="font-medium">{state.preferences.selectedChain.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
