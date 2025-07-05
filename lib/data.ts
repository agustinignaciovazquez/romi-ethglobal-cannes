import type { Token, Chain, Transaction } from "@/types"

export const tokens: Token[] = [
  {
    name: "USDC Pol",
    contractAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    imageUrl: "/usdc.png",
  },
  {
    name: "USDC Arb",
    contractAddress: "0x5Df6eD08EEC2fD5e41914d291c0cf48Cd3564421",
    imageUrl: "/usdc.png",
  },
  {
    name: "USDC Op",
    contractAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    imageUrl: "/usdc.png",
  },
  {
    name: "USDC Base",
    contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    imageUrl: "/usdc.png",
  },
  {
    name: "USDC Sepolia",
    contractAddress: "0xf661043d9Bc1ef2169Ef90ad3b2285Cf8Bfc0AE2",
    imageUrl: "/usdc.png",
  },
]

export const chains: Chain[] = [
  // {
  //   name: "Polygon",
  //   chainId: 80002,
  //   imageUrl: "/placeholder.svg?height=32&width=32",
  // },
  // {
  //   name: "Arbitrum",
  //   chainId: 421614,
  //   imageUrl: "/placeholder.svg?height=32&width=32",
  // },
  // {
  //   name: "Optimism",
  //   chainId: 11155420,
  //   imageUrl: "/placeholder.svg?height=32&width=32",
  // },
  {
    name: "Base",
    chainId: 8453,
    imageUrl: "/placeholder.svg?height=32&width=32",
  },
  // {
  //   name: "Sepolia",
  //   chainId: 11155111,
  //   imageUrl: "/placeholder.svg?height=32&width=32",
  // },
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