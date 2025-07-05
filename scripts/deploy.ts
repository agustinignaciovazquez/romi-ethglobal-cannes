import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying RomiFactory with:", deployer.address);
  const balance = await deployer.provider!.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Get chain information
  const network = await deployer.provider!.getNetwork();
  const chainId = Number(network.chainId);
  const isBaseChain = chainId === 8453 || chainId === 84532; // Base mainnet or Base Sepolia

  console.log("\nChain Information:");
  console.log("Chain ID:", chainId);
  console.log("Is Base Chain:", isBaseChain);

  // Show chain name
  const chainName = chainId === 8453 ? "Base Mainnet" :
    chainId === 84532 ? "Base Sepolia" :
      chainId === 1 ? "Ethereum Mainnet" :
        chainId === 11155111 ? "Sepolia" :
          chainId === 42161 ? "Arbitrum One" :
            chainId === 10 ? "Optimism" :
              chainId === 31337 ? "Localhost" :
                `Chain ${chainId}`;
  console.log("Network:", chainName);

  // Get the L2Registrar address from environment or use zero address for non-Base chains
  const l2RegistrarAddress = process.env.L2_REGISTRAR_ADDRESS || "0x0000000000000000000000000000000000000000";

  console.log("L2Registrar Address:", l2RegistrarAddress);

  if (!isBaseChain && l2RegistrarAddress !== "0x0000000000000000000000000000000000000000") {
    console.log("⚠️ Warning: Non-Base chain with L2Registrar address. ENS registration won't work.");
  }

  if (isBaseChain && l2RegistrarAddress === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️ Warning: Base chain with zero L2Registrar address. ENS registration will be disabled.");
  }

  const Factory = await ethers.getContractFactory("RomiFactory");
  const factory = await Factory.deploy(l2RegistrarAddress);

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("✅ RomiFactory deployed to:", address);

  // Check if factory has L2Registrar capability
  const hasRegistrar = await factory.hasL2Registrar();
  console.log("Factory has L2Registrar:", hasRegistrar);

  // Final deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log(`Network: ${chainName} (Chain ID: ${chainId})`);
  console.log(`Contract Address: ${address}`);
  console.log(`ENS Registration: ${isBaseChain && hasRegistrar ? "✅ Enabled" : "❌ Disabled"}`);
  if (isBaseChain && hasRegistrar) {
    console.log("🚀 Ready for ENS subdomain registration!");
  } else if (isBaseChain && !hasRegistrar) {
    console.log("⚠️ Base chain detected but no L2Registrar configured");
  } else {
    console.log("ℹ️ Non-Base chain - regular deployment only");
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
