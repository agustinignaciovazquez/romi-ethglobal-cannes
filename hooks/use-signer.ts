import { ConnectedWallet, useWallets } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { useState, useEffect } from "react"

export function useSigner(wallet?: ConnectedWallet) {
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!wallet) {
      setSigner(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    const getSigner = async () => {
      try {
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()
        setSigner(signer)
      } catch (err) {
        console.error("Error getting signer:", err)
        setError(err instanceof Error ? err.message : "Failed to get signer")
        setSigner(null)
      } finally {
        setIsLoading(false)
      }
    }

    getSigner()
  }, [wallet])

  return { signer, isLoading, error }
}
