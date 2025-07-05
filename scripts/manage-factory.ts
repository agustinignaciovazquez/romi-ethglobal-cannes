import hre from "hardhat";
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

async function main() {
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

    if (!FACTORY_ADDRESS) {
        console.error("❌ Error: NEXT_PUBLIC_FACTORY_ADDRESS environment variable is required");
        process.exit(1);
    }

    console.log(`\n🔧 RomiFactory Management Tool`);
    console.log(`Network: ${hre.network.name}`);
    console.log(`Factory: ${FACTORY_ADDRESS}`);

    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    console.log(`Signer: ${signer.address}`);

    // Get the factory contract
    const factory = await hre.ethers.getContractAt("RomiFactory", FACTORY_ADDRESS);

    // Check current owner
    const currentOwner = await factory.owner();
    console.log(`Current factory owner: ${currentOwner}`);

    if (signer.address.toLowerCase() !== currentOwner.toLowerCase()) {
        console.error("❌ Error: Current signer is not the factory owner");
        process.exit(1);
    }

    // Get current L2Registrar
    const l2RegistrarAddress = await factory.l2Registrar();
    console.log(`Current L2Registrar: ${l2RegistrarAddress}`);

    console.log(`\n🛠️ Available Actions:`);
    console.log("1. Transfer factory ownership");
    console.log("2. Set new L2Registrar address");
    console.log("3. Check ENS name availability");
    console.log("4. View factory configuration");

    const action = await getUserInput("Choose an action (1-4): ");

    switch (action) {
        case "1":
            await transferFactoryOwnership(factory);
            break;
        case "2":
            await setL2Registrar(factory);
            break;
        case "3":
            await checkENSAvailability(factory);
            break;
        case "4":
            await viewConfiguration(factory);
            break;
        default:
            console.log("Invalid action selected");
    }
}

async function transferFactoryOwnership(factory: any) {
    const newOwnerAddress = await getUserInput("Enter new owner address: ");

    if (!hre.ethers.isAddress(newOwnerAddress)) {
        console.error("❌ Invalid address");
        return;
    }

    const confirmation = await getUserInput(`⚠️ Are you sure you want to transfer factory ownership to ${newOwnerAddress}? (yes/no): `);

    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
        console.log("❌ Transfer cancelled");
        return;
    }

    try {
        console.log(`\n🔄 Transferring factory ownership to: ${newOwnerAddress}`);
        const tx = await factory.transferOwnership(newOwnerAddress);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Factory ownership transferred successfully");
    } catch (error) {
        console.error("❌ Failed to transfer factory ownership:", error);
    }
}

async function setL2Registrar(factory: any) {
    const newRegistrarAddress = await getUserInput("Enter new L2Registrar address: ");

    if (!hre.ethers.isAddress(newRegistrarAddress)) {
        console.error("❌ Invalid address");
        return;
    }

    try {
        console.log(`\n🔄 Setting L2Registrar to: ${newRegistrarAddress}`);
        const tx = await factory.setL2Registrar(newRegistrarAddress);
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ L2Registrar updated successfully");
    } catch (error) {
        console.error("❌ Failed to set L2Registrar:", error);
    }
}

async function checkENSAvailability(factory: any) {
    const ensName = await getUserInput("Enter ENS name to check (without .eth): ");

    try {
        const available = await factory.checkENSAvailability(ensName);
        console.log(`\n📋 ENS name "${ensName}.eth" is ${available ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
    } catch (error) {
        console.error("❌ Failed to check ENS availability:", error);
    }
}

async function viewConfiguration(factory: any) {
    try {
        const owner = await factory.owner();
        const l2Registrar = await factory.l2Registrar();

        console.log(`\n📋 Factory Configuration:`);
        console.log(`Owner: ${owner}`);
        console.log(`L2Registrar: ${l2Registrar}`);

        // Try to get L2Registrar owner
        try {
            const registrar = await hre.ethers.getContractAt("L2Registrar", l2Registrar);
            const registrarOwner = await registrar.owner();
            console.log(`L2Registrar Owner: ${registrarOwner}`);

            if (registrarOwner.toLowerCase() === await factory.getAddress().then(addr => addr.toLowerCase())) {
                console.log("✅ L2Registrar is owned by RomiFactory");
            } else {
                console.log("⚠️ L2Registrar is NOT owned by RomiFactory");
            }
        } catch (error) {
            console.log("⚠️ Could not check L2Registrar ownership");
        }

    } catch (error) {
        console.error("❌ Failed to view configuration:", error);
    }
}

main()
    .then(() => {
        console.log("\n✅ Management script completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Management script failed:", error);
        process.exit(1);
    });
