import { ethers } from "hardhat";
import type { Provider, Signer } from "ethers";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

// ENS Registry and L1 Resolver addresses (Sepolia)
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const L1_RESOLVER_ADDRESS = "0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61";

// Sepolia RPC URL - you can use Infura, Alchemy, or other provider
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_PROJECT_ID";

// ENS Registry ABI (minimal)
const ENS_REGISTRY_ABI = [
    "function owner(bytes32 node) external view returns (address)",
    "function resolver(bytes32 node) external view returns (address)",
    "function setResolver(bytes32 node, address resolver) external"
];

// L1 Resolver ABI (minimal)
const L1_RESOLVER_ABI = [
    "function setL2Registry(bytes32 node, uint64 targetChainId, address targetRegistryAddress) external"
];

// Function to get user input from stdin
function getUserInput(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Function to validate ENS name
function validateEnsName(ensName: string): boolean {
    return ensName.endsWith('.eth') && ensName.length > 4;
}

// Function to get ENS node hash
function getEnsNode(ensName: string): string {
    return ethers.namehash(ensName);
}

// Function to check if deployer owns the ENS name
async function checkEnsOwnership(ensName: string, deployerAddress: string, provider: Provider): Promise<boolean> {
    const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
    const node = getEnsNode(ensName);
    
    try {
        const owner = await ensRegistry.owner(node);
        console.log(`ENS ${ensName} owner:`, owner);
        console.log(`Deployer address:`, deployerAddress);
        
        return owner.toLowerCase() === deployerAddress.toLowerCase();
    } catch (error) {
        console.error("Error calling ENS registry:", error);
        throw new Error(`Failed to check ownership for ${ensName}. Make sure the ENS name exists.`);
    }
}

// Function to set resolver and L2 registry
async function setResolverAndL2Registry(
    ensName: string,
    deployerSigner: Signer,
    l2RegistryAddress: string,
    chainId: number
): Promise<void> {
    const node = getEnsNode(ensName);

    // Connect to ENS Registry on Sepolia
    const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, deployerSigner);

    // Check current resolver
    console.log(`\n🔍 Checking current resolver for ${ensName}...`);
    const currentResolver = await ensRegistry.resolver(node);
    console.log(`Current resolver for ${ensName}:`, currentResolver);

    if (currentResolver.toLowerCase() !== L1_RESOLVER_ADDRESS.toLowerCase()) {
        console.log(`\n🔄 Setting resolver for ${ensName} to L1Resolver...`);
        const setResolverTx = await ensRegistry.setResolver(node, L1_RESOLVER_ADDRESS);
        console.log(`Transaction hash: ${setResolverTx.hash}`);
        await setResolverTx.wait();
        console.log(`✅ Resolver set to L1Resolver: ${L1_RESOLVER_ADDRESS}`);
    } else {
        console.log(`✅ Resolver already set to L1Resolver`);
    }

    // Connect to L1 Resolver and set L2 registry
    console.log(`\n🔗 Setting L2 registry for ${ensName}...`);
    const l1Resolver = new ethers.Contract(L1_RESOLVER_ADDRESS, L1_RESOLVER_ABI, deployerSigner);
    const setL2RegistryTx = await l1Resolver.setL2Registry(node, chainId, l2RegistryAddress);
    console.log(`Transaction hash: ${setL2RegistryTx.hash}`);
    await setL2RegistryTx.wait();
    console.log(`✅ L2 registry set: Chain ID ${chainId}, Registry: ${l2RegistryAddress}`);
}

async function main() {
    console.log("🌐 ENS L1 Resolver Setup (Sepolia)");
    console.log("===================================");

    // Check if we have a Sepolia RPC URL
    if (!process.env.SEPOLIA_RPC_URL) {
        console.error("❌ Please set SEPOLIA_RPC_URL in your .env file");
        console.log("Example: SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID");
        process.exit(1);
    }

    // Create Sepolia provider
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Check if we have a private key for Sepolia
    if (!process.env.PRIVATE_KEY) {
        console.error("❌ Please set PRIVATE_KEY in your .env file");
        process.exit(1);
    }

    // Create signer for Sepolia
    const sepoliaSigner = new ethers.Wallet(process.env.PRIVATE_KEY, sepoliaProvider);
    
    console.log("Using account:", sepoliaSigner.address);
    
    // Check balance on Sepolia
    const balance = await sepoliaProvider.getBalance(sepoliaSigner.address);
    console.log("Sepolia balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.001")) {
        console.warn("⚠️  Warning: Low Sepolia ETH balance. You may need more for transactions.");
    }

    // Get ENS name
    const ensName = await getUserInput("Enter your ENS name (must end with .eth, e.g., toromi.eth): ");

    if (!validateEnsName(ensName)) {
        console.error("❌ Invalid ENS name. It must end with '.eth' and be at least 5 characters long.");
        process.exit(1);
    }

    // Check ownership
    console.log(`\n🔍 Checking ownership of ${ensName} on Sepolia...`);
    try {
        const isOwner = await checkEnsOwnership(ensName, sepoliaSigner.address, sepoliaProvider);
        
        if (!isOwner) {
            console.error(`❌ You are not the owner of ${ensName}.`);
            console.log("Make sure:");
            console.log("1. You own this ENS name");
            console.log("2. The ENS name exists");
            console.log("3. You're using the correct private key");
            process.exit(1);
        }
        
        console.log(`✅ Confirmed: You own ${ensName}`);
    } catch (error) {
        console.error("❌ Error checking ENS ownership:", error);
        process.exit(1);
    }

    // Get L2 registry details
    const l2RegistryAddress = await getUserInput("Enter the L2 registry address (from the deployment): ");
    const chainIdInput = await getUserInput("Enter the target chain ID (e.g., 84532 for Base Sepolia): ");
    const chainId = parseInt(chainIdInput);

    if (!ethers.isAddress(l2RegistryAddress)) {
        console.error("❌ Invalid L2 registry address");
        process.exit(1);
    }

    if (isNaN(chainId) || chainId <= 0) {
        console.error("❌ Invalid chain ID");
        process.exit(1);
    }

    console.log(`\n📋 Setup Summary:`);
    console.log(`ENS Name: ${ensName}`);
    console.log(`L2 Registry: ${l2RegistryAddress}`);
    console.log(`Target Chain ID: ${chainId}`);
    console.log(`L1 Resolver: ${L1_RESOLVER_ADDRESS}`);

    const confirm = await getUserInput("\nProceed with setup? (y/N): ");
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log("Setup cancelled.");
        process.exit(0);
    }

    // Perform the setup
    try {
        await setResolverAndL2Registry(
            ensName,
            sepoliaSigner,
            l2RegistryAddress,
            chainId
        );
        
        console.log("\n🎉 ENS L1 Resolver setup completed successfully!");
        console.log("================================");
        console.log(`ENS Name: ${ensName}`);
        console.log(`Resolver: ${L1_RESOLVER_ADDRESS}`);
        console.log(`L2 Registry: ${l2RegistryAddress}`);
        console.log(`Chain ID: ${chainId}`);
        
    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
