// app/api/hello/route.ts
import type { NextRequest } from 'next/server'
import { ethers } from 'ethers'
import SmartAccountArtifact from '@/artifacts/contracts/romi/RomiSmartAccount.sol/RomiSmartAccount.json'
import Create3FactoryArtifact from '@/artifacts/contracts/romi/RomiFactory.sol/RomiFactory.json'
import { chains } from '../../../lib/data'

const PRIVATE_KEY = process.env.NEXT_PRIVATE_PK!
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, config, signature } = body

    if (!address) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    for(const chain of chains) {
      const rpcUrl = process.env[`NEXT_PUBLIC_${chain.chainId}_RPC_URL`]
      if (!rpcUrl) {
        return Response.json({ error: `No RPC found for chainId ${chain.chainId}` }, { status: 400 })
      }
  
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
        
      const smartAccount = new ethers.Contract(address, SmartAccountArtifact.abi, wallet)
  
      console.log('Smart Account deployed at:', config, signature)
  
      smartAccount.updateConfigWithSig(config.token, BigInt(config.chainId), BigInt(config.nonce), signature)
    }

    return Response.json({
      deployed: address,
    })
  } catch (error: any) {
    console.error('Deployment error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
