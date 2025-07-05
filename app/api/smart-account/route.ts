import { NextRequest } from 'next/server'
import { ethers } from 'ethers'
import Create3FactoryArtifact from '@/artifacts/contracts/Factory.sol/Factory.json'

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!
const PRIVATE_KEY = process.env.NEXT_PRIVATE_PK!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const salt = searchParams.get('salt')

    if (!salt) {
      return Response.json({ error: 'Missing salt' }, { status: 400 })
    }

    const rpcUrl = process.env.NEXT_PUBLIC_DEFAULT_RPC!
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    const factory = new ethers.Contract(FACTORY_ADDRESS, Create3FactoryArtifact.abi, provider)
    const predictedAddress = await factory.getDeployed(wallet.address, ethers.keccak256(ethers.toUtf8Bytes(salt)))

    return Response.json({
      predictedAddress,
      salt
    })
  } catch (error: any) {
    console.error('Predict endpoint error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}