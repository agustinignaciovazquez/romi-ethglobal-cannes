import { ethers } from "hardhat";
import * as readline from "readline";

async function main() {
  // You'll need to replace this with your deployed contract address
  const REGISTRAR_ADDRESS = process.env.REGISTRAR_ADDRESS;
  
  if (!REGISTRAR_ADDRESS) {
    console.error("❌ Error: REGISTRAR_ADDRESS environment variable is required");
    console.log("Usage: REGISTRAR_ADDRESS=0x... npx hardhat run scripts/transfer-ownership.ts");
    process.exit(1);
  }

  // Get the current signer (should be the current owner)
  const [signer] = await ethers.getSigners();
  console.log(`📝 Current signer: ${signer.address}`);
  
  // Get the L2Registrar contract factory and attach to deployed contract
  const L2Registrar = await ethers.getContractFactory("L2Registrar");
  const registrar = L2Registrar.attach(REGISTRAR_ADDRESS);
  
  // Check if the signer is the current owner
  const currentOwner = await registrar.owner();
    console.log(`👑 Current owner: ${currentOwner}`);

    if (signer.address.toLowerCase() !== currentOwner.toLowerCase()) {
        console.error("❌ Error: Current signer is not the owner of the contract");
        process.exit(1);
    }

    // Create readline interface to get input from stdin
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Function to get user input
    const getInput = (question: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    };

    try {
        // Get the new owner address from user input
        const newOwnerAddress = await getInput("Enter the new owner address: ");

        // Validate the address
        if (!ethers.isAddress(newOwnerAddress)) {
            console.error("❌ Error: Invalid Ethereum address");
            rl.close();
            process.exit(1);
        }

        // Check if it's not the zero address
        if (newOwnerAddress === ethers.ZeroAddress) {
            console.error("❌ Error: Cannot transfer ownership to zero address");
            rl.close();
            process.exit(1);
        }

        // Confirm the transfer
        const confirmation = await getInput(
            `⚠️  Are you sure you want to transfer ownership from ${currentOwner} to ${newOwnerAddress}? (yes/no): `
        );

        if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
            console.log("❌ Ownership transfer cancelled");
            rl.close();
            return;
        }

        console.log("🔄 Transferring ownership...");

        // Execute the ownership transfer
        const tx = await registrar.transferOwnership(newOwnerAddress);
        console.log(`📤 Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);

        // Verify the new owner
        const verifyNewOwner = await registrar.owner();
        console.log(`👑 New owner: ${verifyNewOwner}`);

        if (verifyNewOwner.toLowerCase() === newOwnerAddress.toLowerCase()) {
            console.log("🎉 Ownership transfer completed successfully!");
        } else {
            console.error("❌ Ownership transfer may have failed - owner mismatch");
        }

    } catch (error) {
        console.error("❌ Error during ownership transfer:", error);
    } finally {
        rl.close();
    }
}

// Handle errors
main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
