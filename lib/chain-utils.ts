/**
 * Utility functions for chain-specific operations
 */

// Base chain IDs that support ENS registration
export const BASE_CHAIN_IDS = {
    BASE_MAINNET: 8453,
    BASE_SEPOLIA: 84532,
} as const;

/**
 * Check if a chain ID corresponds to a Base chain that supports ENS
 * @param chainId - The chain ID to check
 * @returns true if the chain supports ENS registration via L2Registrar
 */
export function isBaseChain(chainId: number): boolean {
    return Object.values(BASE_CHAIN_IDS).includes(chainId as any);
}

/**
 * Get the chain name from chain ID
 * @param chainId - The chain ID
 * @returns Human readable chain name
 */
export function getChainName(chainId: number): string {
    switch (chainId) {
        case BASE_CHAIN_IDS.BASE_MAINNET:
            return 'Base Mainnet';
        case BASE_CHAIN_IDS.BASE_SEPOLIA:
            return 'Base Sepolia';
        case 42161:
            return 'Arbitrum One';
        case 10:
            return 'Optimism';
        case 1:
            return 'Ethereum Mainnet';
        case 11155111:
            return 'Sepolia';
        default:
            return `Chain ${chainId}`;
    }
}

/**
 * Check if ENS registration should be attempted for a given chain and ENS name
 * @param chainId - The chain ID
 * @param ensName - The ENS name (optional)
 * @returns true if ENS registration should be attempted
 */
export function shouldAttemptENSRegistration(chainId: number, ensName?: string): boolean {
    return false
}
