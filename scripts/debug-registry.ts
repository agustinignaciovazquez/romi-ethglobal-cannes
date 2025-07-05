import { ethers } from "hardhat";
import { network } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

// Your specific registry address
const REGISTRY_ADDRESS = "0xcbd1662b5e606420e79f32ea26de40c16acaa881";

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

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = network.name;
    const chainId = network.config.chainId;

    console.log("🔧 Registry Debug & Permission Script");
    console.log("=====================================");
    console.log(`Network: ${networkName} (Chain ID: ${chainId})`);
    console.log("Account:", deployer.address);
    console.log("Registry Address:", REGISTRY_ADDRESS);

    // Check balance
    const balance = await deployer.provider!.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Connect to the registry
    console.log("\n🔍 Step 1: Connecting to Registry...");
    const registry = await ethers.getContractAt("L2Registry", REGISTRY_ADDRESS);

    try {
        console.log("✅ Successfully connected to registry");

        // Get basic registry info
        console.log("\n📊 Step 2: Getting Registry Information...");

        try {
            const name = await registry.name();
            console.log("Registry Name:", name);
        } catch (error) {
            console.log("⚠️ Could not get registry name:", error);
        }

        try {
            const symbol = await registry.symbol();
            console.log("Registry Symbol:", symbol);
        } catch (error) {
            console.log("⚠️ Could not get registry symbol:", error);
        }

        try {
            const baseNode = await registry.baseNode();
            console.log("Base Node:", baseNode);
        } catch (error) {
            console.log("⚠️ Could not get base node:", error);
        }

        try {
            const totalSupply = await registry.totalSupply();
            console.log("Total Supply:", totalSupply.toString());
        } catch (error) {
            console.log("⚠️ Could not get total supply:", error);
        }

        // Check ownership and permissions
        console.log("\n🔐 Step 3: Checking Ownership & Permissions...");

        try {
            const owner = await registry.owner();
            console.log("Registry Owner:", owner);
            console.log("Is deployer the owner?", owner.toLowerCase() === deployer.address.toLowerCase());
        } catch (error) {
            console.log("⚠️ Could not get registry owner:", error);
        }

        // Check if deployer is a registrar
        try {
            const isRegistrar = await registry.registrars(deployer.address);
            console.log("Is deployer a registrar:", isRegistrar);
        } catch (error) {
            console.log("⚠️ Could not check registrar status:", error);
        }

        // Ask user what they want to do
        console.log("\n🛠️ Step 4: Available Actions");
        console.log("1. Deploy and approve a new L2Registrar");
        console.log("2. Check approvals for existing registrar");
        console.log("3. Set approval for specific registrar");
        console.log("4. Add registrar to registry");
        console.log("5. Test registration directly");
        console.log("6. Check registrar status");

        const action = await getUserInput("Choose an action (1-6): ");

        switch (action) {
            case "1":
                await deployAndApproveRegistrar(registry, deployer);
                break;
            case "2":
                await checkApprovals(registry, deployer);
                break;
            case "3":
                await setApprovalForRegistrar(registry, deployer);
                break;
            case "4":
                await addRegistrarToRegistry(registry, deployer);
                break;
            case "5":
                await testDirectRegistration(registry, deployer);
                break;
            case "6":
                await checkRegistrarStatus(registry, deployer);
                break;
            default:
                console.log("Invalid action selected");
        }

    } catch (error) {
        console.error("❌ Failed to connect to registry:", error);
        console.log("\nPossible issues:");
        console.log("1. Wrong network - make sure you're on the right chain");
        console.log("2. Registry address is incorrect");
        console.log("3. Registry contract is not deployed");
    }
}

async function deployAndApproveRegistrar(registry: any, deployer: any) {
    console.log("\n🎫 Deploying new L2Registrar...");

    try {
        const L2Registrar = await ethers.getContractFactory("L2Registrar");
        const registrar = await L2Registrar.deploy(REGISTRY_ADDRESS);
        await registrar.waitForDeployment();
        const registrarAddress = await registrar.getAddress();

        console.log("✅ L2Registrar deployed to:", registrarAddress);

        // Approve the registrar
        console.log("\n🔐 Approving registrar...");
        const approveTx = await registry.setApprovalForAll(registrarAddress, true);
        await approveTx.wait();
        console.log("✅ Registrar approved successfully");

        // Add registrar to registry
        console.log("\n➕ Adding registrar to registry...");
        const addTx = await registry.addRegistrar(registrarAddress);
        await addTx.wait();
        console.log("✅ Registrar added to registry successfully");

        // Test if approval worked
        const isApproved = await registry.isApprovedForAll(deployer.address, registrarAddress);
        const isRegistrar = await registry.registrars(registrarAddress);
        console.log("Is approved:", isApproved);
        console.log("Is registrar:", isRegistrar);

        return registrarAddress;

    } catch (error) {
        console.error("❌ Failed to deploy/approve registrar:", error);
    }
}

async function checkApprovals(registry: any, deployer: any) {
    const registrarAddress = await getUserInput("Enter registrar address to check: ");

    try {
        const isApproved = await registry.isApprovedForAll(deployer.address, registrarAddress);
        console.log(`Is ${registrarAddress} approved for ${deployer.address}:`, isApproved);

        // Check if it's a registrar
        const isRegistrar = await registry.registrars(registrarAddress);
        console.log(`Is ${registrarAddress} a registrar:`, isRegistrar);

    } catch (error) {
        console.error("❌ Failed to check approvals:", error);
    }
}

async function setApprovalForRegistrar(registry: any, deployer: any) {
    const registrarAddress = await getUserInput("Enter registrar address to approve: ");

    try {
        console.log(`\n🔐 Setting approval for ${registrarAddress}...`);
        const approveTx = await registry.setApprovalForAll(registrarAddress, true);
        await approveTx.wait();
        console.log("✅ Approval set successfully");

        // Verify
        const isApproved = await registry.isApprovedForAll(deployer.address, registrarAddress);
        console.log("Verification - Is approved:", isApproved);

    } catch (error) {
        console.error("❌ Failed to set approval:", error);
    }
}

async function testDirectRegistration(registry: any, deployer: any) {
    const label = await getUserInput("Enter label to register (e.g., 'test'): ");

    try {
        console.log(`\n🧪 Testing direct registration of '${label}'...`);

        // Get base node
        const baseNode = await registry.baseNode();
        console.log("Base Node:", baseNode);

        // Try to create subnode
        const createTx = await registry.createSubnode(
            baseNode,
            label,
            deployer.address,
            []
        );
        await createTx.wait();

        console.log(`✅ Successfully registered '${label}' directly`);

        // Check if it worked
        const node = await registry.makeNode(baseNode, label);
        const tokenId = BigInt(node);
        const owner = await registry.ownerOf(tokenId);
        console.log(`Owner of '${label}':`, owner);

    } catch (error) {
        console.error("❌ Failed direct registration:", error);
    }
}

async function addRegistrarToRegistry(registry: any, deployer: any) {
    const registrarAddress = await getUserInput("Enter registrar address to add: ");

    try {
        console.log(`\n➕ Adding ${registrarAddress} as registrar...`);

        const addTx = await registry.addRegistrar(registrarAddress);
        await addTx.wait();

        console.log("✅ Registrar added successfully");

        // Verify
        const isRegistrar = await registry.registrars(registrarAddress);
        console.log("Verification - Is registrar:", isRegistrar);

    } catch (error) {
        console.error("❌ Failed to add registrar:", error);
    }
}

async function checkRegistrarStatus(registry: any, deployer: any) {
    const address = await getUserInput("Enter address to check registrar status: ");

    try {
        const isRegistrar = await registry.registrars(address);
        console.log(`Is ${address} a registrar:`, isRegistrar);

        const isApproved = await registry.isApprovedForAll(deployer.address, address);
        console.log(`Is ${address} approved for ${deployer.address}:`, isApproved);

    } catch (error) {
        console.error("❌ Failed to check registrar status:", error);
    }
}

main()
    .then(() => {
        console.log("\n✅ Debug script completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Debug script failed:", error);
        process.exit(1);
    });
