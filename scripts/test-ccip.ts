import { ethers } from "hardhat";
import { getCCIPChainSelector } from "../lib/ccip-config";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await deployer.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Testing CCIP functionality...");
  console.log("Network:", network.name, "Chain ID:", chainId);

  // Replace with your deployed smart account address
  const SMART_ACCOUNT_ADDRESS = process.env.SMART_ACCOUNT_ADDRESS;
  
  if (!SMART_ACCOUNT_ADDRESS) {
    console.error("❌ Please set SMART_ACCOUNT_ADDRESS environment variable");
    process.exit(1);
  }

  // Connect to deployed smart account
  const smartAccount = await ethers.getContractAt("RomiSmartAccount", SMART_ACCOUNT_ADDRESS);
  
  console.log("Smart Account:", SMART_ACCOUNT_ADDRESS);
  console.log("Owner:", await smartAccount.owner());

  // Test 1: Check if common chains are allowlisted
  console.log("\n🔍 Checking allowlisted chains...");
  
  const commonChains = {
    "Ethereum Sepolia": "16015286601757825753",
    "Polygon Amoy": "16281711391670634445",
    "Arbitrum Sepolia": "3478487238524512106",
    "Base Sepolia": "10344971235874465080",
  };

  for (const [chainName, selector] of Object.entries(commonChains)) {
    try {
      const isAllowlisted = await smartAccount.allowlistedChains(selector);
      console.log(`${chainName}: ${isAllowlisted ? "✅ Allowlisted" : "❌ Not allowlisted"}`);
    } catch (error) {
      console.log(`${chainName}: ❌ Error checking status`);
    }
  }

  // Test 2: Check ETH balance for fees
  console.log("\n💰 Checking ETH balance for CCIP fees...");
  const ethBalance = await deployer.provider.getBalance(SMART_ACCOUNT_ADDRESS);
  console.log("ETH Balance:", ethers.formatEther(ethBalance), "ETH");
  
  if (ethBalance < ethers.parseEther("0.01")) {
    console.log("⚠️ Low ETH balance. Consider funding the account for CCIP fees.");
  }

  // Test 3: Check configuration
  console.log("\n⚙️ Checking configuration...");
  try {
    const config = await smartAccount.config();
    console.log("Configured token:", config.token);
    console.log("Configured chain ID:", config.chainId.toString());
    
    if (config.token === ethers.ZeroAddress) {
      console.log("⚠️ No token configured. Use updateConfigWithSig() to set output token.");
    }
  } catch (error) {
    console.log("❌ Error reading config:", error);
  }

  // Test 4: Estimate fees for cross-chain transfer (if token is configured)
  console.log("\n💸 Estimating CCIP fees...");
  try {
    const config = await smartAccount.config();
    if (config.token !== ethers.ZeroAddress) {
      // Test fee for transferring to Polygon Amoy (if current chain is not Polygon)
      const destinationSelector = "16281711391670634445"; // Polygon Amoy
      
      if (chainId !== 80002) { // Not on Polygon Amoy
        const testAmount = ethers.parseUnits("1", 6); // 1 USDC (assuming 6 decimals)
        
        try {
          const fee = await smartAccount.getCrossChainFee(
            destinationSelector,
            config.token,
            testAmount
          );
          console.log(`Fee to transfer 1 token to Polygon Amoy: ${ethers.formatEther(fee)} ETH`);
        } catch (error) {
          console.log("❌ Could not estimate fee:", error);
        }
      } else {
        console.log("ℹ️ Cannot estimate fee to same chain");
      }
    } else {
      console.log("ℹ️ Skipping fee estimation - no token configured");
    }
  } catch (error) {
    console.log("❌ Error estimating fees:", error);
  }

  // Test 5: Allowlist a chain (optional)
  if (process.env.ALLOWLIST_TEST_CHAIN === "true") {
    console.log("\n🔗 Allowlisting test chain...");
    try {
      const testChainSelector = "16281711391670634445"; // Polygon Amoy
      const tx = await smartAccount.allowlistDestinationChain(testChainSelector, true);
      await tx.wait();
      console.log("✅ Successfully allowlisted Polygon Amoy");
    } catch (error) {
      console.log("❌ Error allowlisting chain:", error);
    }
  }

  console.log("\n🎉 Testing completed!");
  console.log("\nNext steps:");
  console.log("1. Fund the account with ETH if balance is low");
  console.log("2. Configure output token using updateConfigWithSig()");
  console.log("3. Allowlist destination chains you want to use");
  console.log("4. Test with actual swaps and transfers");
}

main().catch((error) => {
  console.error("❌ Testing failed:", error);
  process.exit(1);
});
