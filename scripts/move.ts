import { ethers } from "hardhat";
import { RomiSmartAccount } from "../typechain-types";

async function main() {
    const RomiSmartAccountFactory = await ethers.getContractFactory('RomiSmartAccount');
    const romiSmartAccount = RomiSmartAccountFactory.attach('0x587f384EE879A3d7BBe1dc4A635116932F68144B') as RomiSmartAccount;
    romiSmartAccount.transferERC20("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", "0xEfe4512185B31A7A674Ee3EEF7453b7FAC6243A9", "444729")
}

void main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});