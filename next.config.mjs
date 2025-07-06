/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // Explicitly expose environment variables to the client
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
    NEXT_PUBLIC_L2_REGISTRAR_ADDRESS: process.env.NEXT_PUBLIC_L2_REGISTRAR_ADDRESS,
    NEXT_PUBLIC_DEPLOYER_ADDRESS: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS,
    NEXT_PUBLIC_31337_RPC_URL: process.env.NEXT_PUBLIC_31337_RPC_URL,
    NEXT_PUBLIC_8453_RPC_URL: process.env.NEXT_PUBLIC_8453_RPC_URL,
    NEXT_PUBLIC_84532_RPC_URL: process.env.NEXT_PUBLIC_84532_RPC_URL,
    NEXT_PUBLIC_DEFAULT_RPC: process.env.NEXT_PUBLIC_DEFAULT_RPC,
    NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL,
  },
}

export default nextConfig
