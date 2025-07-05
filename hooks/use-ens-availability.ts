import { useState, useCallback } from "react"
import { ethers } from "ethers"

// Hardcoded L2 Registry address on Base
const L2_REGISTRY_ADDRESS = "0xcbd1662b5e606420e79f32ea26de40c16acaa881"

// Root domain for ENS subdomains (Sepolia testnet)
export const ROOT_DOMAIN = "testoromi.eth"

// ENS Registry ABI - L2Registry is an ERC721 contract
const ENS_REGISTRY_ABI = [
    "function owner(bytes32 node) view returns (address)",
    "function ownerOf(uint256 tokenId) view returns (address)"
]

export interface EnsAvailabilityState {
    isChecking: boolean
    isAvailable: boolean | null
    error: string
}

export function useEnsAvailability() {
    const [state, setState] = useState<EnsAvailabilityState>({
        isChecking: false,
        isAvailable: null,
        error: ""
    })

    const checkAvailability = useCallback(async (subdomain: string) => {
        // Reset state
        setState({ isChecking: false, isAvailable: null, error: "" })

        // Basic validation TODO: Improve this on contract level
        if (!subdomain || subdomain.length < 3) {
            return
        }

        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            setState({
                isChecking: false,
                isAvailable: false,
                error: "Only lowercase letters, numbers, and hyphens allowed"
            })
            return
        }

        if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
            setState({
                isChecking: false,
                isAvailable: false,
                error: "Cannot start or end with a hyphen"
            })
            return
        }

        // Check for reserved/unavailable names
        const unavailableNames = ["admin", "test", "user", "wallet", "romi", "eth", "crypto", "www", "api", "app"]
        if (unavailableNames.includes(subdomain.toLowerCase())) {
            setState({
                isChecking: false,
                isAvailable: false,
                error: "This subdomain is reserved"
            })
            return
        }

        setState(prev => ({ ...prev, isChecking: true }))

        try {
            // Get Base Sepolia RPC URL from environment
            const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
            const provider = new ethers.JsonRpcProvider(rpcUrl)

            // Create contract instance
            const registryContract = new ethers.Contract(L2_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider)

            // Calculate the namehash for subdomain.testoromi.eth
            const fullName = `${subdomain}.${ROOT_DOMAIN}`
            const nameHash = ethers.namehash(fullName)

            // Check if the name exists by checking the owner
            // If owner returns zero address, the name is available
            const owner = await registryContract.owner(nameHash)
            const isAvailable = owner === ethers.ZeroAddress

            setState({
                isChecking: false,
                isAvailable,
                error: isAvailable ? "" : "This subdomain is already taken"
            })
        } catch (error) {
            console.error("ENS availability check failed:", error)
            setState({
                isChecking: false,
                isAvailable: false,
                error: "Failed to check availability"
            })
        }
    }, [])

    return {
        ...state,
        checkAvailability
    }
}
