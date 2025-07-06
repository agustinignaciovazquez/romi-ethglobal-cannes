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

  console.log("\nChain Information:");
  console.log("Chain ID:", chainId);

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

  const Factory = await ethers.getContractFactory("RomiFactory");
  const factory = await Factory.deploy();

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("✅ RomiFactory deployed to:", address);

  // Final deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log(`Network: ${chainName} (Chain ID: ${chainId})`);
  console.log(`Contract Address: ${address}`);
  console.log("🚀 Ready for smart account deployment!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
