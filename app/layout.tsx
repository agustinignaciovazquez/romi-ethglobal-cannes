import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/contexts/wallet-context"
import { WalletHeader } from "@/components/wallet-header"
import { PrivyClientProvider } from "@/components/privy-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "romi - All roads lead to romi",
  description: "A no-jargon, no-hassle multichain ERC-20 wallet for crypto beginners",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyClientProvider>
          <WalletProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <WalletHeader />
              {children}
            </div>
          </WalletProvider>
        </PrivyClientProvider>
      </body>
    </html>
  )
}
