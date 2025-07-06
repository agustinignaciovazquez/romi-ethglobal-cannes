import type { Token, Chain, Transaction } from "@/types"

export const tokens: Token[] = [
  {
    name: "USDC",
    contractAddress: (chainId: number) => {
      switch (chainId) {
        case 42161: // Arbitrum
          return "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
        case 10: // Optimism
          return "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
        default: // Base
          return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      }
    },
    imageUrl: "/tokens/usdc.webp",
  },
  {
    name: "Weth",
    contractAddress: (chainId: number) => {
      switch (chainId) {
        case 42161: // Arbitrum
          return "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
        case 10: // Optimism
          return "0x4200000000000000000000000000000000000006"
        default: // Base
          return "0x4200000000000000000000000000000000000006"
      }
    },
    imageUrl: "/tokens/weth.webp",
  },
]

export const chains: Chain[] = [
  {
    name: "Arbitrum",
    chainId: 42161,
    imageUrl: "/blockchains/arbitrum.svg?height=32&width=32",
    chainLinkRouter: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8",
  },
  {
    name: "Optimism",
    chainId: 10,
    imageUrl: "/blockchains/optimism.svg?height=32&width=32",
    chainLinkRouter: "0x3206695CaE29952f4b0c22a169725a865bc8Ce0f",
  },
  {
    name: "Base",
    chainId: 8453,
    imageUrl: "/blockchains/base.svg?height=32&width=32",
    chainLinkRouter: "0x881e3A65B4d4a04dD529061dd0071cf975F58bCD",
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-01-15T10:30:00Z",
    fromToken: "USDC",
    fromChain: "Ethereum",
    amount: "100.00",
    toToken: "USDC",
    toChain: "Polygon",
    status: "Successful",
  },
  {
    id: "2",
    date: "2024-01-14T15:45:00Z",
    fromToken: "WETH",
    fromChain: "Arbitrum",
    amount: "0.5",
    toToken: "WETH",
    toChain: "Base",
    status: "Successful",
  },
  {
    id: "3",
    date: "2024-01-13T09:15:00Z",
    fromToken: "DAI",
    fromChain: "Ethereum",
    amount: "250.00",
    toToken: "DAI",
    toChain: "Optimism",
    status: "Pending",
  },
]
