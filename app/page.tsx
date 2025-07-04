"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"

export default function HomePage() {
  const router = useRouter()
  const { state } = useWallet()

  useEffect(() => {
    // Redirect based on wallet state
    if (!state.userWalletAddress) {
      router.push("/connect")
    } else if (!state.hasSetup) {
      router.push("/setup")
    } else {
      router.push("/dashboard")
    }
  }, [state.userWalletAddress, state.hasSetup, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
