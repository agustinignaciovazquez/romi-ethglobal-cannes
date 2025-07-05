import { ConnectedWallet, useWallets } from "@privy-io/react-auth"
import { ethers } from "ethers"

export async function useSigner(wallet: ConnectedWallet) {
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    return await provider.getSigner()
  }
  