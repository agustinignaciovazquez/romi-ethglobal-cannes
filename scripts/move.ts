import { ethers } from "hardhat";
import { RomiSmartAccount } from "../typechain-types";

async function main() {
    const RomiSmartAccountFactory = await ethers.getContractFactory('RomiSmartAccount');
    const romiSmartAccount = RomiSmartAccountFactory.attach('0x1e6C86bA7f116Fa7B67185A616B45543f80f0A49') as RomiSmartAccount;
    romiSmartAccount.transferERC20("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", "0x4Fa01238Bb4BEb3d8AAA44ed84AE7813f41C8160", "1208167")
}

void main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});