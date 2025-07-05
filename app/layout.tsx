import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "@/contexts/wallet-context"
import { WalletHeader } from "@/components/wallet-header"
import { PrivyClientProvider } from "@/components/privy-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Romi - All roads lead to Romi",
  description: "A no-jargon, no-hassle multichain ERC-20 wallet for crypto beginners",
  generator: 'v0.dev',
  icons: {
    apple: [
      { url: '/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/apple-icon-180x180.png', sizes: '180x180' },
    ],
    icon: [
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'theme-color': '#ffffff',
  }
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
