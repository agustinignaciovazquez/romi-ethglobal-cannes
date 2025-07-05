import { ethers, network } from "hardhat";
import { RomiSmartAccount } from "../typechain-types";
import { Contract } from "ethers";

async function main() {
    while(true) {
        const smartAccounts = ['0xe4ff44a4CAFc21D07630754D218CE2ab7fEe74C8'.toLowerCase()]

        for (const SmartAccount of smartAccounts) {
            console.log(`Processing smart account: ${SmartAccount}`);
            await processSmartAccount(SmartAccount, 'base');
        }
    
        // sleep for 20 seconds
        await new Promise(resolve => setTimeout(resolve, 20000));
    }
}

async function processSmartAccount(smartAccount: string, chain: string) {
    const tokens = await getTokens(smartAccount, chain);
    console.log(`Tokens for ${smartAccount}:`, tokens);
    const smartAccountContractFactory = await ethers.getContractFactory('RomiSmartAccount')
    const smartAccountContract = smartAccountContractFactory.attach(smartAccount) as RomiSmartAccount;
    const config = await smartAccountContract.config();
    const selectedToken = config[0];
    const chainId = config[1];
    console.log(`Smart Account Config for ${smartAccount}:`, {
        selectedToken,
        chainId: chainId.toString(),
    });

    for (const token of tokens) {
        try{
            const amount = token.amount
            if(token.contract.toLowerCase() !== selectedToken.toLowerCase()) {
                await approve(smartAccountContract, token.contract, amount);
                await swap(smartAccountContract, token.contract, selectedToken, chainId.toString(), amount);
            } else {
                console.log(`Bridgin ${token.contract} as it is the selected token.`);
            }
        } catch (error) {
            console.error(`Error processing token ${token.contract} for smart account ${smartAccount}:`);
        }    
    }
}


void main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});

async function getTokens(address: string, chain: string) {
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODc3MTYwMzgsImp0aSI6IjQyMWVmMDIwLWFiYjYtNDEyMi1hMjFhLTcwOGJjOWE3MTJiZSIsImlhdCI6MTc1MTcxNjAzOCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbW9kdTdmNTUyMTRlYTViNzY3OGUiLCJ2IjoxLCJha2kiOiJhZWRmMjk0MGQ1ZDhjOTU3NWM4NjRkYzVhOTJiMzE0MTdlY2UzNmI1MzVlOGRiMWE2YjVmODU3MzFjZTY0NWMxIiwidWlkIjoiMG1vZHU3ZjU1MjE0ZWE1Yjc2NzhlIn0.CbtoA-dagXibGBAtVgGnnbEF8XwSUxRXTE3Xpxd-K9tjVJXd9id8mfXOT3zbHVgW0mSRSfgGK5HT2rfhxEVTdw',
        },
    }

    const res = await fetch(`https://token-api.thegraph.com/balances/evm/${address}?network_id=${chain}`, options)
    return res.json().then(({data}) => data)
 }

async function swap(smartAccount: RomiSmartAccount, srcToken: string, dstToken: string, chainId: string, amount: bigint) { 
   const API_KEY = process.env.ONEINCH_API_KEY!;
   const apiBaseUrl = `https://api.1inch.dev/swap/v6.0/${chainId}`;
   const headers = {
     headers: {
       Authorization: `Bearer ${API_KEY}`,
       Accept: "application/json",
     },
   };
 
   const swapParams = {
     src: srcToken, 
     dst: dstToken,
     amount, // 
     from: await smartAccount.getAddress(),
     slippage: 2,
     disableEstimate: false,
     allowPartialFill: false,
   };
 
   function apiRequestUrl(method: string, query: Record<string, any>) {
     return apiBaseUrl + method + "?" + new URLSearchParams(query).toString();
   }
 
   async function buildTxForSwap(swapParams: any) {
     const url = apiRequestUrl("/swap", swapParams);
     const res = await fetch(url, headers);
     const {tx} = await res.json();
     console.log("🔍 Response from 1inch:", res.status);
     if (!tx.data) throw new Error("Invalid swap transaction from 1inch");
     return tx.data;
   }
 
   console.log("🔄 Fetching swap data from 1inch...");
   const swapCalldata = await buildTxForSwap(swapParams);
 
   console.log("🚀 Executing swap via smart account...");
   const execTx = await smartAccount.executeSwap(swapCalldata);
   console.log("✅ Swap tx sent:", execTx.hash);
   await execTx.wait();
   console.log("🎉 Swap complete!");
}

export async function approve(smartAccount: RomiSmartAccount, srcToken: string, amount: bigint) {
    if(await checkTokenAllowance(srcToken, await smartAccount.getAddress(), '0x111111125421cA6dc452d289314280a0f8842A65', amount)) {
        return
    }
    console.log("🔄 Approving token...");
    const approveTx = await smartAccount.approveToken(srcToken);
    console.log("✅ Approval tx sent:", approveTx.hash);
    await approveTx.wait();
    console.log("🎉 Approval complete!");
}

  
  export async function checkTokenAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
    requiredAmount: bigint
  ): Promise<boolean> {
    console.log(`🔍 Checking`, tokenAddress, owner, spender, requiredAmount);

    const iface = new ethers.Interface([
         "function allowance(address owner, address spender) view returns (uint256)"
    ]);

    // @ts-ignore
    const provider = new ethers.JsonRpcProvider(network.config.url);
    const token = new Contract(tokenAddress, iface, provider);

    const allowance = await token.allowance(owner, spender)
  
    console.log(`🔍 Allowance (${tokenAddress}) for ${spender} by ${owner}: ${allowance.toString()}`);
  
    if (BigInt(allowance) >= requiredAmount) {
      console.log("✅ Allowance is sufficient.");
      return true;
    } else {
      console.log("❌ Allowance is insufficient.");
      return false;
    }
  }