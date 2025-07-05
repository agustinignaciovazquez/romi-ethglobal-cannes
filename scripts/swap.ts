// import { ethers, network } from "hardhat";
// import * as dotenv from "dotenv";

// dotenv.config();

// async function main() {
//   const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
//   const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
//   const walletAddress = wallet.address;

//   const chainId = Number(network.config.chainId!);
//   const API_KEY = process.env.ONEINCH_API_KEY!;
//   const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}`;
//   const headers = {
//     headers: {
//       Authorization: `Bearer ${API_KEY}`,
//       Accept: "application/json",
//     },
//   };

//   const swapParams = {
//     src: "0x4200000000000000000000000000000000000006", 
//     dst: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
//     amount: "300000", // Amount in smallest unit (wei)
//     from: walletAddress,
//     slippage: 1,
//     disableEstimate: false,
//     allowPartialFill: false,
//   };

//   function apiRequestUrl(method: string, query: Record<string, any>) {
//     return apiBaseUrl + method + "?" + new URLSearchParams(query).toString();
//   }

//   async function signAndSendTransaction(tx: any) {
//     const nonce = await provider.getTransactionCount(wallet.address, "latest");
//     const feeData = await provider.getFeeData();
//     const gasLimit = BigInt(tx.gas || (await provider.estimateGas({ ...tx, from: wallet.address })));
//     const networkInfo = await provider.getNetwork();

//     const txToSign = {
//       to: tx.to,
//       data: tx.data,
//       value: BigInt(tx.value || 0),
//       gasLimit,
//       maxFeePerGas: feeData.maxFeePerGas!,
//       maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
//       nonce: nonce,
//       chainId: Number(networkInfo.chainId),
//       type: 2,
//     };

//     console.log("\uD83D\uDEA7 Final tx to sign:", txToSign);

//     const response = await wallet.sendTransaction(txToSign);
//     console.log("\uD83D\uDE80 Tx sent! Hash:", response.hash);

//     const receipt = await response.wait();
//     console.log("\u2705 Tx mined in block")
//   }

//   async function buildApproveTx(tokenAddress: string, amount?: string) {
//     const url = apiRequestUrl("/approve/transaction", amount ? { tokenAddress, amount } : { tokenAddress });

//     const res = await fetch(url, headers);
//     const tx = await res.json();

//     if (!tx.to || !tx.data) throw new Error("Invalid approval transaction from 1inch");

//     const gas = await provider.estimateGas({
//       to: tx.to,
//       data: tx.data,
//       from: wallet.address,
//       value: tx.value ? ethers.toBigInt(tx.value) : undefined,
//     });

//     return {
//       ...tx,
//       gas,
//     };
//   }

//   async function buildSwapTx(swapParams: any) {
//     const url = apiRequestUrl("/swap", swapParams);
//     const res = await fetch(url, headers);
//     const json = await res.json();

//     if (!json.tx || !json.tx.to || !json.tx.data) throw new Error("Invalid swap transaction from 1inch");

//     const gas = await provider.estimateGas({
//       ...json.tx,
//       from: wallet.address,
//     });

//     return {
//       ...json.tx,
//       gas,
//     };
//   }

//   console.log("\uD83D\uDD04 Fetching approval tx from 1inch...");
//   const approveTx = await buildApproveTx(swapParams.src, swapParams.amount);
//   console.log("\uD83D\uDCDD Approval transaction ready:", approveTx);

//   console.log("\uD83D\uDE80 Sending approval tx...");
//   await signAndSendTransaction(approveTx);

//   console.log("\uD83D\uDD04 Fetching swap tx from 1inch...");
//   const swapTx = await buildSwapTx(swapParams);
//   console.log("\uD83D\uDCDD Swap transaction ready:", swapTx);

//   console.log("\uD83D\uDE80 Sending swap tx...");
//   const swapTxHash = await signAndSendTransaction(swapTx);
//   console.log("\u2705 Swap tx hash:", swapTxHash);
// }

// main().catch((error) => {
//   console.error("\u274C Error:", error);
//   process.exit(1);
// });

import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const smartAccountAddress = '0x72093e7D869d513eB537740fbE08C56a8E7f86b6'
  const chainId = Number(network.config.chainId!);

  const API_KEY = process.env.ONEINCH_API_KEY!;
  const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}`;
  const headers = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
    },
  };

  const swapParams = {
    src: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
    dst: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", // "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    amount: "20000", // 
    from: smartAccountAddress,
    slippage: 1,
    disableEstimate: false,
    allowPartialFill: false,
  };

  const smartAccount = new ethers.Contract(
    smartAccountAddress,
    [
      "function approveToken(address token) external",
      "function executeSwap(bytes calldata data) external"
    ],
    wallet
  );

  function apiRequestUrl(method: string, query: Record<string, any>) {
    return apiBaseUrl + method + "?" + new URLSearchParams(query).toString();
  }

  async function buildApproveTx(tokenAddress: string, amount?: string) {
    const url = apiRequestUrl("/approve/transaction", amount ? { tokenAddress, amount } : { tokenAddress });

    const res = await fetch(url, headers);
    console.log("🔍 Response from 1inch:", res.status, res.statusText);
    const tx = await res.json();

    if (!tx.to || !tx.data) throw new Error("Invalid approval transaction from 1inch");

    return tx;
  }

  console.log("🔄 Calling approveToken via smart account...");
  const approveTx = await buildApproveTx(swapParams.src, swapParams.amount);
  const approveAmount = BigInt(swapParams.amount);

  const approveTxResp = await smartAccount.approveToken(swapParams.src);
  console.log("✅ Approve tx sent:", approveTxResp.hash);
  await approveTxResp.wait();

  async function buildTxForSwap(swapParams: any) {
    const url = apiRequestUrl("/swap", swapParams);
    const res = await fetch(url, headers);
    const a = await res.json();
    console.log(a);
    console.log("🔍 Response from 1inch:", res.status);
    console.log("🔍 Response from 1inch:", a.tx);
    if (!a.tx.data) throw new Error("Invalid swap transaction from 1inch");
    return a.tx.data;
  }

  console.log("🔄 Fetching swap data from 1inch...");
  const swapCalldata = await buildTxForSwap(swapParams);

  console.log("🚀 Executing swap via smart account...");
  const execTx = await smartAccount.executeSwap(swapCalldata);
  console.log("✅ Swap tx sent:", execTx.hash);
  await execTx.wait();
  console.log("🎉 Swap complete!");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});