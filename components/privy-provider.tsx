"use client"

import { PrivyProvider } from '@privy-io/react-auth'

export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''}
            config={{
                loginMethods: ['wallet', 'email', 'google', 'apple'],
                appearance: {
                    theme: 'light',
                    accentColor: '#3B82F6',
                    logo: '/placeholder-logo.svg',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
            }}
        >
            {children}
        </PrivyProvider>
    )
}
