export interface Token {
  name: string
  contractAddress: string
  imageUrl: string
}

export interface Chain {
  name: string
  chainId: number
  imageUrl: string
}

export interface Transaction {
  id: string
  date: string
  fromToken: string
  fromChain: string
  amount: string
  toToken: string
  toChain: string
  status: "Pending" | "Successful" | "Failed"
}

export interface UserPreferences {
  selectedToken: Token
  selectedChain: Chain
}

export interface WalletState {
  userWalletAddress: string | null
  smartWalletAddress: string | null
  ensName: string | null
  hasSetup: boolean
  preferences: UserPreferences | null
  transactions: Transaction[]
  totalBalance: string
}
