import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log(`\n🚀 Deploying updated RomiFactory with ENS integration on ${hre.network.name}...`);

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];
    console.log(`Deployer: ${deployer.address}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH`);

    // Get the L2Registrar address (can be zero for non-Base chains)
    const l2RegistrarAddress = process.env.L2_REGISTRAR_ADDRESS || "0x0000000000000000000000000000000000000000";

    // Determine if this is a Base chain (supports ENS)
    const chainId = hre.network.config.chainId;
    const isBaseChain = chainId === 8453 || chainId === 84532; // Base mainnet or Base Sepolia

    console.log(`\n📋 Configuration:`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Is Base Chain: ${isBaseChain}`);
    console.log(`L2Registrar Address: ${l2RegistrarAddress}`);

    if (!isBaseChain && l2RegistrarAddress !== "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ Warning: Non-Base chain with L2Registrar address. ENS registration won't work.");
    }

    if (isBaseChain && l2RegistrarAddress === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️ Warning: Base chain with zero L2Registrar address. ENS registration will be disabled.");
    }

    // Deploy RomiFactory
    console.log(`\n🏭 Deploying RomiFactory...`);
    const RomiFactory = await hre.ethers.getContractFactory("RomiFactory");
    const factory = await RomiFactory.deploy(l2RegistrarAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ RomiFactory deployed to:", factoryAddress);

    // Only try to transfer L2Registrar ownership on Base chains with a valid registrar
    if (isBaseChain && l2RegistrarAddress !== "0x0000000000000000000000000000000000000000") {
        try {
            console.log(`\n🔐 Transferring L2Registrar ownership to RomiFactory...`);
            const l2Registrar = await hre.ethers.getContractAt("L2Registrar", l2RegistrarAddress);

            // Check current owner
            const currentOwner = await l2Registrar.owner();
            console.log(`Current L2Registrar owner: ${currentOwner}`);

            if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
                const transferTx = await l2Registrar.transferOwnership(factoryAddress);
                await transferTx.wait();
                console.log("✅ L2Registrar ownership transferred to RomiFactory");

                // Verify transfer
                const newOwner = await l2Registrar.owner();
                console.log(`New L2Registrar owner: ${newOwner}`);
            } else {
                console.log("⚠️ Current signer is not the owner of L2Registrar. You'll need to transfer ownership manually.");
            }
        } catch (error) {
            console.error("⚠️ Failed to transfer L2Registrar ownership:", error);
            console.log("You may need to manually transfer ownership of the L2Registrar to the RomiFactory");
        }
    } else {
        console.log("ℹ️ Skipping L2Registrar ownership transfer (not applicable for this chain)");
    }

    // Summary
    console.log(`\n🎉 Deployment Summary:`);
    console.log("================================");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`RomiFactory: ${factoryAddress}`);
    console.log(`L2Registrar: ${l2RegistrarAddress}`);
    console.log(`ENS Support: ${isBaseChain ? 'Yes' : 'No'}`);

    console.log(`\n📝 Verification Command:`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${factoryAddress} "${l2RegistrarAddress}"`);

    console.log(`\n📚 Environment Variables to Update:`);
    console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);

    console.log(`\n🔧 Next Steps:`);
    console.log("1. Update your environment variables with the new factory address");
    if (isBaseChain) {
        console.log("2. Ensure L2Registrar ownership is transferred to RomiFactory (if applicable)");
        console.log("3. Your API can now deploy smart accounts with automatic ENS registration on Base");
    } else {
        console.log("2. Deploy this same factory on Base chains for ENS registration support");
        console.log("3. Your API will deploy smart accounts without ENS registration on this chain");
    }
    console.log("4. Use the deployWithENS function by passing an 'ensName' parameter to your API");
}

main()
    .then(() => {
        console.log("\n✅ Deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
