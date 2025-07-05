import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { getCCIPRouterAddress, getOneInchRouterAddress } from "../lib/ccip-config";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await deployer.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("Deploying RomiSmartAccount with:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", chainId);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Get router addresses for the current chain
  let ccipRouterAddress: string;
  let oneInchRouterAddress: string;

  try {
    ccipRouterAddress = getCCIPRouterAddress(chainId);
    console.log("✅ CCIP Router address:", ccipRouterAddress);
  } catch (error) {
    console.error("❌ CCIP Router not supported on this chain:", chainId);
    console.log("Supported chains: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base");
    process.exit(1);
  }

  try {
    oneInchRouterAddress = getOneInchRouterAddress(chainId);
    console.log("✅ 1inch Router address:", oneInchRouterAddress);
  } catch (error) {
    console.error("❌ 1inch Router not supported on this chain:", chainId);
    console.log("Supported chains: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism, Base");
    process.exit(1);
  }

  // Deploy RomiSmartAccount
  const RomiSmartAccount = await ethers.getContractFactory("RomiSmartAccount");
  
  const initialNonce = 0;
  
  console.log("\nDeploying RomiSmartAccount with parameters:");
  console.log("- Initial Owner:", deployer.address);
  console.log("- Initial Nonce:", initialNonce);
  console.log("- 1inch Router:", oneInchRouterAddress);
  console.log("- CCIP Router:", ccipRouterAddress);

  const smartAccount = await RomiSmartAccount.deploy(
    deployer.address,     // initialOwner
    initialNonce,         // initialNextNonce
    oneInchRouterAddress, // oneInchRouterAddress
    ccipRouterAddress     // ccipRouterAddress
  );

  await smartAccount.waitForDeployment();
  const smartAccountAddress = await smartAccount.getAddress();

  console.log("✅ RomiSmartAccount deployed to:", smartAccountAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await smartAccount.owner();
  const nonce = await smartAccount.nextNonce();
  // Note: these methods might not be available in typechain, so we'll skip them for now

  console.log("- Owner:", owner);
  console.log("- Next Nonce:", nonce.toString());
  console.log("- 1inch Router:", oneInchRouterAddress, "(configured)");
  console.log("- CCIP Router:", ccipRouterAddress, "(configured)");

  // Example: Allowlist some common destination chains (optional)
  if (process.env.ALLOWLIST_CHAINS === "true") {
    console.log("\n🔗 Allowlisting destination chains...");
    
    // Common testnet chain selectors for cross-chain testing
    const commonTestnetSelectors = {
      "Ethereum Sepolia": "16015286601757825753",
      "Polygon Amoy": "16281711391670634445",
      "Arbitrum Sepolia": "3478487238524512106",
      "Optimism Sepolia": "5224473277236331295",
      "Base Sepolia": "10344971235874465080",
    };

    for (const [chainName, selector] of Object.entries(commonTestnetSelectors)) {
      try {
        // Call allowlistDestinationChain manually since typechain types may not be available
        const tx = await smartAccount.getFunction("allowlistDestinationChain")(selector, true);
        await tx.wait();
        console.log(`✅ Allowlisted ${chainName} (${selector})`);
      } catch (error) {
        console.log(`⚠️ Failed to allowlist ${chainName}:`, error);
      }
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Fund the smart account with ETH for CCIP fees");
  console.log("2. Configure the output token using updateConfigWithSig()");
  console.log("3. Allowlist destination chains using allowlistDestinationChain()");
  console.log("4. Test with executeSwap() or swapAndTransferCrossChain()");
  
  return {
    smartAccount: smartAccountAddress,
    owner: deployer.address,
    chainId,
    ccipRouter: ccipRouterAddress,
    oneInchRouter: oneInchRouterAddress,
  };
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
