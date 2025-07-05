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
        console.log("7. Remove registrar from registry");
        console.log("8. Show contract verification commands");

        const action = await getUserInput("Choose an action (1-8): ");

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
            case "7":
                await removeRegistrarFromRegistry(registry, deployer);
                break;
            case "8":
                await showVerificationCommands(registry, deployer);
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

async function removeRegistrarFromRegistry(registry: any, deployer: any) {
    const registrarAddress = await getUserInput("Enter registrar address to remove: ");

    try {
        // First check if it's currently a registrar
        const isRegistrar = await registry.registrars(registrarAddress);
        if (!isRegistrar) {
            console.log(`⚠️ ${registrarAddress} is not currently a registrar`);
            return;
        }

        console.log(`\n🗑️ Removing ${registrarAddress} from registry...`);

        const removeTx = await registry.removeRegistrar(registrarAddress);
        await removeTx.wait();

        console.log("✅ Registrar removed successfully");

        // Verify removal
        const isStillRegistrar = await registry.registrars(registrarAddress);
        console.log("Verification - Is still registrar:", isStillRegistrar);

        if (!isStillRegistrar) {
            console.log("✅ Registrar successfully removed from registry");
        } else {
            console.log("⚠️ Registrar might still be in registry - please check manually");
        }

    } catch (error) {
        console.error("❌ Failed to remove registrar:", error);
        console.log("\nPossible issues:");
        console.log("1. You don't have permission to remove registrars (not registry owner)");
        console.log("2. The registrar address is invalid");
        console.log("3. The registrar was not added to the registry");
    }
}

async function showVerificationCommands(registry: any, deployer: any) {
    console.log("\n📋 Contract Verification Commands");
    console.log("=================================");

    const networkName = network.name;
    const chainId = network.config.chainId;

    console.log(`\n🌐 Current Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`📍 Registry Address: ${REGISTRY_ADDRESS}`);

    // Get registry info for verification
    try {
        console.log("\n📊 Getting contract information...");

        let baseNode = "N/A";
        let registryName = "N/A";
        let registrySymbol = "N/A";

        try {
            baseNode = await registry.baseNode();
            console.log(`Base Node: ${baseNode}`);
        } catch (error) {
            console.log("⚠️ Could not get base node");
        }

        try {
            registryName = await registry.name();
            console.log(`Registry Name: ${registryName}`);
        } catch (error) {
            console.log("⚠️ Could not get registry name");
        }

        try {
            registrySymbol = await registry.symbol();
            console.log(`Registry Symbol: ${registrySymbol}`);
        } catch (error) {
            console.log("⚠️ Could not get registry symbol");
        }

        // Generate verification commands based on network
        console.log("\n🔍 Verification Commands:");
        console.log("========================");

        if (networkName === "baseSepolia") {
            console.log("\n📝 For Base Sepolia:");
            console.log("```bash");
            console.log(`pnpm hardhat verify --network baseSepolia ${REGISTRY_ADDRESS} "${baseNode}" "${registryName}" "${registrySymbol}"`);
            console.log("```");
            console.log("\n💡 Alternative with individual parameters:");
            console.log("```bash");
            console.log(`pnpm hardhat verify \\`);
            console.log(`  --network baseSepolia \\`);
            console.log(`  ${REGISTRY_ADDRESS} \\`);
            console.log(`  "${baseNode}" \\`);
            console.log(`  "${registryName}" \\`);
            console.log(`  "${registrySymbol}"`);
            console.log("```");
        } else if (networkName === "sepolia") {
            console.log("\n📝 For Sepolia:");
            console.log("```bash");
            console.log(`pnpm hardhat verify --network sepolia ${REGISTRY_ADDRESS} "${baseNode}" "${registryName}" "${registrySymbol}"`);
            console.log("```");
        } else if (networkName === "mainnet") {
            console.log("\n📝 For Mainnet:");
            console.log("```bash");
            console.log(`pnpm hardhat verify --network mainnet ${REGISTRY_ADDRESS} "${baseNode}" "${registryName}" "${registrySymbol}"`);
            console.log("```");
        } else {
            console.log(`\n📝 For ${networkName}:`);
            console.log("```bash");
            console.log(`pnpm hardhat verify --network ${networkName} ${REGISTRY_ADDRESS} "${baseNode}" "${registryName}" "${registrySymbol}"`);
            console.log("```");
        }

        // Show L2Registrar verification if user wants
        const verifyRegistrar = await getUserInput("\nDo you want to see L2Registrar verification commands? (y/n): ");

        if (verifyRegistrar.toLowerCase() === 'y' || verifyRegistrar.toLowerCase() === 'yes') {
            const registrarAddress = await getUserInput("Enter L2Registrar address: ");

            console.log("\n🎫 L2Registrar Verification:");
            console.log("===========================");
            console.log("```bash");
            console.log(`pnpm hardhat verify --network ${networkName} ${registrarAddress} "${REGISTRY_ADDRESS}"`);
            console.log("```");
        }

        console.log("\n📚 Additional Notes:");
        console.log("- Make sure you have ETHERSCAN_API_KEY set in your .env file");
        console.log("- Constructor parameters must match exactly what was used during deployment");
        console.log("- If verification fails, check that the contract source code is compiled with the same settings");
        console.log("- For custom networks, make sure etherscan config is properly set in hardhat.config.ts");

        // Offer to run verification automatically
        const runVerification = await getUserInput("\nDo you want to run verification automatically? (y/n): ");

        if (runVerification.toLowerCase() === 'y' || runVerification.toLowerCase() === 'yes') {
            await runAutomaticVerification(networkName, REGISTRY_ADDRESS, baseNode, registryName, registrySymbol);
        }

    } catch (error) {
        console.error("❌ Failed to get contract information:", error);
        console.log("\n📝 Generic verification command:");
        console.log("```bash");
        console.log(`pnpm hardhat verify --network ${networkName} ${REGISTRY_ADDRESS} [CONSTRUCTOR_ARGS...]`);
        console.log("```");
    }
}

async function runAutomaticVerification(networkName: string, contractAddress: string, baseNode: string, registryName: string, registrySymbol: string) {
    console.log("\n🔄 Running automatic verification...");

    try {
        // First, ensure contracts are compiled
        console.log("1. Cleaning and recompiling contracts...");

        const { spawn } = require('child_process');

        // Clean first
        const cleanProcess = spawn('pnpm', ['hardhat', 'clean'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        await new Promise((resolve, reject) => {
            cleanProcess.on('close', (code: number) => {
                if (code === 0) {
                    console.log("✅ Clean completed");
                    resolve(code);
                } else {
                    reject(new Error(`Clean failed with exit code ${code}`));
                }
            });
        });

        // Then compile
        const compileProcess = spawn('pnpm', ['hardhat', 'compile'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        await new Promise((resolve, reject) => {
            compileProcess.on('close', (code: number) => {
                if (code === 0) {
                    console.log("✅ Compilation completed");
                    resolve(code);
                } else {
                    reject(new Error(`Compilation failed with exit code ${code}`));
                }
            });
        });

        // Now run verification
        console.log("2. Running verification...");

        const verifyArgs = [
            'hardhat',
            'verify',
            '--network',
            networkName,
            contractAddress,
            baseNode,
            registryName,
            registrySymbol
        ];

        console.log(`Running: pnpm ${verifyArgs.join(' ')}`);

        const verifyProcess = spawn('pnpm', verifyArgs, {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        await new Promise((resolve, reject) => {
            verifyProcess.on('close', (code: number) => {
                if (code === 0) {
                    console.log("✅ Verification completed successfully!");
                    resolve(code);
                } else {
                    console.log(`⚠️ Verification completed with exit code ${code}`);
                    console.log("This might be normal if the contract was already verified.");
                    resolve(code);
                }
            });
        });

    } catch (error) {
        console.error("❌ Automatic verification failed:", error);
        console.log("\nTry running the verification command manually:");
        console.log(`pnpm hardhat verify --network ${networkName} ${contractAddress} "${baseNode}" "${registryName}" "${registrySymbol}"`);
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
