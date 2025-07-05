import { ethers } from "hardhat";
import { network } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

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

async function main() {
    const [deployer] = await ethers.getSigners();

    const networkName = network.name;
    const chainId = network.config.chainId;

    console.log(`🚀 Deploying Durin ENS contracts to ${networkName} (Chain ID: ${chainId})`);
    console.log("Deploying with account:", deployer.address);

    const balance = await deployer.provider!.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Different balance warnings for different networks
    const minBalance = networkName === "localhost" ? ethers.parseEther("0.001") : ethers.parseEther("0.01");
    if (balance < minBalance) {
        console.warn(`⚠️  Warning: Low balance. You may need more ETH for deployment on ${networkName}.`);
    }

    // Step 0: Get and validate ENS name
    console.log("\n🏷️  Step 0: ENS Name Setup");
    console.log("================================");

    let ensName = "";
    let isValidEns = false;

    while (!isValidEns) {
        ensName = await getUserInput("Enter your ENS name (must end with .eth, e.g., toromi.eth): ");

        if (!validateEnsName(ensName)) {
            console.error("❌ Invalid ENS name. It must end with '.eth' and be at least 5 characters long.");
            continue;
        }

        console.log(`✅ Using ENS name: ${ensName}`);
        console.log("⚠️  Note: ENS ownership verification will be done separately using the setup-ens-l1.ts script");
        isValidEns = true;
    }

    // Step 1: Deploy L2Registry implementation
    console.log("\n📋 Step 1: Deploying L2Registry implementation...");
    const L2Registry = await ethers.getContractFactory("L2Registry");
    const l2RegistryImpl = await L2Registry.deploy();
    await l2RegistryImpl.waitForDeployment();
    const l2RegistryImplAddress = await l2RegistryImpl.getAddress();
    console.log("✅ L2Registry implementation deployed to:", l2RegistryImplAddress);

    // Step 2: Deploy L2RegistryFactory
    console.log("\n🏭 Step 2: Deploying L2RegistryFactory...");
    const L2RegistryFactory = await ethers.getContractFactory("L2RegistryFactory");
    const l2RegistryFactory = await L2RegistryFactory.deploy(l2RegistryImplAddress);
    await l2RegistryFactory.waitForDeployment();
    const l2RegistryFactoryAddress = await l2RegistryFactory.getAddress();
    console.log("✅ L2RegistryFactory deployed to:", l2RegistryFactoryAddress);

    // Step 3: Deploy registry for the inputted ENS name
    console.log(`\n📝 Step 3: Deploying registry for '${ensName}'...`);
    const ensSymbol = ensName.replace('.eth', '').toUpperCase();
    const baseURI = `https://2romi.xyz/metadata/${ensName}/`;

    const deployTx = await l2RegistryFactory.deployRegistry(
        ensName,
        ensSymbol,
        baseURI,
        deployer.address
    );
    const receipt = await deployTx.wait();

    // Get the registry address from the event
    const event = receipt?.logs.find((log: any) => {
        try {
            const parsed = l2RegistryFactory.interface.parseLog(log);
            return parsed?.name === "RegistryDeployed";
        } catch {
            return false;
        }
    });

    let registryAddress = "";
    if (event) {
        const parsed = l2RegistryFactory.interface.parseLog(event);
        registryAddress = parsed?.args.registry;
        console.log(`✅ Registry for ${ensName} deployed to:`, registryAddress);
    } else {
        throw new Error("Failed to get registry address from deployment event");
    }

    // Step 4: Deploy L2Registrar for the registry
    console.log("\n🎫 Step 4: Deploying L2Registrar...");
    const L2Registrar = await ethers.getContractFactory("L2Registrar");
    const l2Registrar = await L2Registrar.deploy(registryAddress);
    await l2Registrar.waitForDeployment();
    const l2RegistrarAddress = await l2Registrar.getAddress();
    console.log("✅ L2Registrar deployed to:", l2RegistrarAddress);

    // Step 5: Set the registrar as approved in the registry
    console.log("\n🔐 Step 5: Approving registrar in the registry...");
    const l2Registry = await ethers.getContractAt("L2Registry", registryAddress);
    const approveTx = await l2Registry.setApprovalForAll(l2RegistrarAddress, true);
    await approveTx.wait();
    console.log("✅ Registrar approved in registry");

    // Summary
    console.log("\n🎉 Deployment Summary:");
    console.log("================================");
    console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
    console.log("Deployer:", deployer.address);
    console.log(`ENS Name: ${ensName}`);
    console.log("L2Registry Implementation:", l2RegistryImplAddress);
    console.log("L2RegistryFactory:", l2RegistryFactoryAddress);
    console.log(`Registry for ${ensName}:`, registryAddress);
    console.log("L2Registrar:", l2RegistrarAddress);
    console.log("================================");

    // Instructions for next steps
    console.log("\n📖 Next Steps:");

    if (networkName === "baseSepolia") {
        console.log("1. Verify contracts on BaseScan:");
        console.log(`   npx hardhat verify --network baseSepolia ${l2RegistryImplAddress}`);
        console.log(`   npx hardhat verify --network baseSepolia ${l2RegistryFactoryAddress} "${l2RegistryImplAddress}"`);
        console.log(`   npx hardhat verify --network baseSepolia ${registryAddress}`);
        console.log(`   npx hardhat verify --network baseSepolia ${l2RegistrarAddress} "${registryAddress}"`);
    } else if (networkName === "localhost") {
        console.log("1. Local deployment completed - no verification needed");
        console.log("2. Make sure your local hardhat node is running:");
        console.log("   pnpm hardhat node");
    }

    console.log("\n2. Set up ENS L1 Resolver (Sepolia):");
    console.log("   Run the L1 setup script to configure ENS resolver:");
    console.log(`   npx hardhat run scripts/setup-ens-l1.ts`);
    console.log(`   You'll need the registry address: ${registryAddress}`);
    console.log(`   And the chain ID: ${chainId}`);

    console.log("\n3. Test registration:");
    console.log(`   You can register subnames like 'test.${ensName}' using the registrar at ${l2RegistrarAddress}`);

    console.log("\n4. Deploy additional registries:");
    console.log(`   Use the factory at ${l2RegistryFactoryAddress} to deploy registries for other domains`);
}

main()
    .then(() => {
        console.log("\n✅ Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
