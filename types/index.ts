export interface Token {
  name: string
  contractAddress: (chainId: number) => string
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
  id: string // Unique identifier for this preference set
  selectedToken: Token
  selectedTokenAddress: string
  selectedChain: Chain
  smartWalletAddress: string
  ensName: string
  setupSignature: string
  createdAt: string // ISO timestamp
}

export interface WalletState {
  userWalletAddress: string | null
  smartWalletAddress: string | null // Current active smart wallet
  ensName: string | null // Current active ENS name
  hasSetup: boolean // Calculated: preferences array is not empty
  preferences: UserPreferences[] // Array of preference sets
  transactions: Transaction[]
  totalBalance: string
}

export interface WalletSetupData {
  preferences: UserPreferences[] // Array of user preferences/setups
  lastActivePreferenceId: string | null // ID of the last active preference
}

export interface WalletSetupMap {
  [walletAddress: string]: WalletSetupData
}
