import type { Token, Chain, Transaction } from "@/types"

export const tokens: Token[] = [
  {
    name: "USDC",
    contractAddress: "0xa0b86a33e6ba3b1c4e6b0b8b8b8b8b8b8b8b8b8b",
    imageUrl: "/usdc.png",
  },
  {
    name: "USDT",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "DAI",
    contractAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "WETH",
    contractAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
]

export const chains: Chain[] = [
  {
    name: "Ethereum",
    chainId: 1,
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Polygon",
    chainId: 137,
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Arbitrum",
    chainId: 42161,
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Optimism",
    chainId: 10,
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Base",
    chainId: 8453,
    imageUrl: "/placeholder.svg?height=32&width=32",
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