"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { WalletState, UserPreferences, Transaction } from "@/types"
import { mockTransactions } from "@/lib/data"

interface WalletContextType {
  state: WalletState
  connectWallet: (address: string) => void
  setActivePreference: (preferenceId: string) => void
  addPreference: (preference: UserPreferences) => void
  setHasSetup: (hasSetup: boolean) => void
  addTransaction: (transaction: Transaction) => void
  updateBalance: (balance: string) => void
  logout: () => void
  reset: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

type WalletAction =
  | { type: "CONNECT_WALLET"; payload: string }
  | { type: "SET_ACTIVE_PREFERENCE"; payload: string }
  | { type: "ADD_PREFERENCE"; payload: UserPreferences }
  | { type: "SET_HAS_SETUP"; payload: boolean }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_BALANCE"; payload: string }
  | { type: "RESET" }

const initialState: WalletState = {
  userWalletAddress: null,
  smartWalletAddress: null,
  ensName: null,
  hasSetup: false,
  preferences: [],
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
    case "SET_ACTIVE_PREFERENCE":
      const activePreference = state.preferences.find(p => p.id === action.payload)
      return {
        ...state,
        smartWalletAddress: activePreference?.smartWalletAddress || null,
        ensName: activePreference?.ensName || null,
      }
    case "ADD_PREFERENCE":
      return {
        ...state,
        preferences: [...state.preferences, action.payload],
        smartWalletAddress: action.payload.smartWalletAddress,
        ensName: action.payload.ensName,
        hasSetup: true,
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
    setActivePreference: useCallback((preferenceId: string) => {
      dispatch({ type: "SET_ACTIVE_PREFERENCE", payload: preferenceId })
    }, []),
    addPreference: useCallback((preference: UserPreferences) => {
      dispatch({ type: "ADD_PREFERENCE", payload: preference })
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
