"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { WalletState, UserPreferences, Transaction } from "@/types"
import { mockTransactions } from "@/lib/data"

interface WalletContextType {
  state: WalletState
  connectWallet: (address: string) => void
  setSmartWallet: (address: string, ensName: string) => void
  setPreferences: (preferences: UserPreferences) => void
  setHasSetup: (hasSetup: boolean) => void
  addTransaction: (transaction: Transaction) => void
  updateBalance: (balance: string) => void
  logout: () => void
  reset: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

type WalletAction =
  | { type: "CONNECT_WALLET"; payload: string }
  | { type: "SET_SMART_WALLET"; payload: { address: string; ensName: string } }
  | { type: "SET_PREFERENCES"; payload: UserPreferences }
  | { type: "SET_HAS_SETUP"; payload: boolean }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_BALANCE"; payload: string }
  | { type: "RESET" }

const initialState: WalletState = {
  userWalletAddress: null,
  smartWalletAddress: null,
  ensName: null,
  hasSetup: false,
  preferences: null,
  transactions: [],
  totalBalance: "0.00",
}

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case "CONNECT_WALLET":
      return {
        ...state,
        userWalletAddress: action.payload,
      }
    case "SET_SMART_WALLET":
      return {
        ...state,
        smartWalletAddress: action.payload.address,
        ensName: action.payload.ensName,
      }
    case "SET_PREFERENCES":
      return {
        ...state,
        preferences: action.payload,
      }
    case "SET_HAS_SETUP":
      return {
        ...state,
        hasSetup: action.payload,
      }
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      }
    case "UPDATE_BALANCE":
      return {
        ...state,
        totalBalance: action.payload,
      }
    case "RESET":
      return initialState
    default:
      return state
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState)

  // Load mock data on mount
  useEffect(() => {
    // Simulate loading existing transactions
    mockTransactions.forEach((tx) => {
      dispatch({ type: "ADD_TRANSACTION", payload: tx })
    })
    dispatch({ type: "UPDATE_BALANCE", payload: "1,247.83" })
  }, [])

  const contextValue: WalletContextType = {
    state,
    connectWallet: useCallback((address: string) => {
      dispatch({ type: "CONNECT_WALLET", payload: address })
    }, []),
    setSmartWallet: useCallback((address: string, ensName: string) => {
      dispatch({ type: "SET_SMART_WALLET", payload: { address, ensName } })
    }, []),
    setPreferences: useCallback((preferences: UserPreferences) => {
      dispatch({ type: "SET_PREFERENCES", payload: preferences })
    }, []),
    setHasSetup: useCallback((hasSetup: boolean) => {
      dispatch({ type: "SET_HAS_SETUP", payload: hasSetup })
    }, []),
    addTransaction: useCallback((transaction: Transaction) => {
      dispatch({ type: "ADD_TRANSACTION", payload: transaction })
    }, []),
    updateBalance: useCallback((balance: string) => {
      dispatch({ type: "UPDATE_BALANCE", payload: balance })
    }, []),
    logout: useCallback(() => {
      dispatch({ type: "RESET" })
    }, []),
    reset: useCallback(() => {
      dispatch({ type: "RESET" })
    }, []),
  }

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
