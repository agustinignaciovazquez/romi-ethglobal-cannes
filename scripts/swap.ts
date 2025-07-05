import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const walletAddress = wallet.address;

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
    src: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // 1INCH token
    dst: "0x4200000000000000000000000000000000000006", // Example: DAI on OP
    amount: "300000", // Amount in smallest unit (wei)
    from: walletAddress,
    slippage: 1,
    disableEstimate: false,
    allowPartialFill: false,
  };

  function apiRequestUrl(method: string, query: Record<string, any>) {
    return apiBaseUrl + method + "?" + new URLSearchParams(query).toString();
  }

  async function signAndSendTransaction(tx: any) {
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    const feeData = await provider.getFeeData();
    const gasLimit = BigInt(tx.gas || (await provider.estimateGas({ ...tx, from: wallet.address })));
    const networkInfo = await provider.getNetwork();

    const txToSign = {
      to: tx.to,
      data: tx.data,
      value: BigInt(tx.value || 0),
      gasLimit,
      maxFeePerGas: feeData.maxFeePerGas!,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
      nonce: nonce,
      chainId: Number(networkInfo.chainId),
      type: 2,
    };

    console.log("\uD83D\uDEA7 Final tx to sign:", txToSign);

    const response = await wallet.sendTransaction(txToSign);
    console.log("\uD83D\uDE80 Tx sent! Hash:", response.hash);

    const receipt = await response.wait();
    console.log("\u2705 Tx mined in block:", receipt.blockNumber);
    return receipt.transactionHash;
  }

  async function buildApproveTx(tokenAddress: string, amount?: string) {
    const url = apiRequestUrl("/approve/transaction", amount ? { tokenAddress, amount } : { tokenAddress });

    const res = await fetch(url, headers);
    const tx = await res.json();

    if (!tx.to || !tx.data) throw new Error("Invalid approval transaction from 1inch");

    const gas = await provider.estimateGas({
      to: tx.to,
      data: tx.data,
      from: wallet.address,
      value: tx.value ? ethers.toBigInt(tx.value) : undefined,
    });

    return {
      ...tx,
      gas,
    };
  }

  async function buildSwapTx(swapParams: any) {
    const url = apiRequestUrl("/swap", swapParams);
    const res = await fetch(url, headers);
    const json = await res.json();

    if (!json.tx || !json.tx.to || !json.tx.data) throw new Error("Invalid swap transaction from 1inch");

    const gas = await provider.estimateGas({
      ...json.tx,
      from: wallet.address,
    });

    return {
      ...json.tx,
      gas,
    };
  }

  console.log("\uD83D\uDD04 Fetching approval tx from 1inch...");
  const approveTx = await buildApproveTx(swapParams.src, swapParams.amount);
  console.log("\uD83D\uDCDD Approval transaction ready:", approveTx);

  console.log("\uD83D\uDE80 Sending approval tx...");
  await signAndSendTransaction(approveTx);

  console.log("\uD83D\uDD04 Fetching swap tx from 1inch...");
  const swapTx = await buildSwapTx(swapParams);
  console.log("\uD83D\uDCDD Swap transaction ready:", swapTx);

  console.log("\uD83D\uDE80 Sending swap tx...");
  const swapTxHash = await signAndSendTransaction(swapTx);
  console.log("\u2705 Swap tx hash:", swapTxHash);
}

main().catch((error) => {
  console.error("\u274C Error:", error);
  process.exit(1);
});