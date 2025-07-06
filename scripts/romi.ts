import { ethers, network } from "hardhat";
import { RomiSmartAccount } from "../typechain-types";
import { Contract } from "ethers";
import { chains } from "../lib/data";

async function main() {
    while(true) {
        const smartAccounts = ['0xEfe4512185B31A7A674Ee3EEF7453b7FAC6243A9'.toLowerCase()]

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
    console.log(`Tokens for ${smartAccount}:`, tokens.map((token: any) => `${token.contract} (${token.amount})`));
    const smartAccountContractFactory = await ethers.getContractFactory('RomiSmartAccount')
    const smartAccountContract = smartAccountContractFactory.attach(smartAccount) as RomiSmartAccount;
    const config = await smartAccountContract.config();
    const selectedToken = config[0];
    const selectedChainId = config[1];
    console.log(`Smart Account Config for ${smartAccount}:`, {
        selectedToken,
        chainId: selectedChainId.toString(),
    });

    for (const token of tokens) {
        try{
            const amount = token.amount
            if(token.contract.toLowerCase() !== selectedToken.toLowerCase()) {
                await approve(smartAccountContract, token.contract, amount, '0x111111125421cA6dc452d289314280a0f8842A65');
                await swap(smartAccountContract, token.contract, selectedToken, token.chainId, amount);
            } else if(selectedChainId !== token.chainId) {
              const router = chains.find((c: any) => c.chainId === Number(selectedChainId))?.chainLinkRouter;
              await approve(smartAccountContract, token.contract, amount, router!);
              bridge(smartAccountContract, token.chainId.toString(), selectedChainId.toString());
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
            Authorization: `Bearer ${process.env.TOKEN_API}`,
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

export async function approve(smartAccount: RomiSmartAccount, srcToken: string, amount: bigint, spender: string) {
    if(await checkTokenAllowance(srcToken, await smartAccount.getAddress(), spender, amount)) {
        return
    }
    console.log("🔄 Approving token...");
    const approveTx = await smartAccount.approveToken(srcToken, spender);
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

  export function bridge(smartAccount: RomiSmartAccount, srcChain: string, dstChain: string) {
    let selector = ''
    const base = '8453'
    const arbitrum = '42161'
    const optimism = '10'

    if(dstChain === arbitrum) {
      selector = '4949039107694359620'
    }
    if(dstChain === optimism) {
      selector = '3734403246176062136'
    }
    if(dstChain === base) {
      selector = '15971525489660198786'
    } 

    smartAccount.bridge(selector, {value: ethers.parseEther("0.0003")})
  }