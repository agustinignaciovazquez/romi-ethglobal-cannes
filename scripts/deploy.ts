import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { Factory } from "../typechain-types";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Create3Factory with:", deployer.address);
  const balance = await deployer.provider!.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("RomiFactory");
  const factory = (await Factory.deploy()) as unknown as Factory;

  await factory.waitForDeployment();
  const address = await factory.getAddress();

  console.log("✅ Create3Factory deployed to:", address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});