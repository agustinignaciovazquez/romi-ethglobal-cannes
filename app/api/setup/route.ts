// app/api/hello/route.ts
import type { NextRequest } from 'next/server'
import { ethers } from 'ethers'
import SmartAccountArtifact from '@/artifacts/contracts/SmartAccount.sol/SmartAccount.json'
import Create3FactoryArtifact from '@/artifacts/contracts/Factory.sol/Factory.json'
import { SmartAccount } from '../../../typechain-types'

const PRIVATE_KEY = process.env.NEXT_PRIVATE_PK!
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!
// Hardhat chainid
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '31337'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, salt } = body

    if (!address || !salt) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    const rpcUrl = process.env[`NEXT_PUBLIC_${chainId}_RPC_URL`]
    if (!rpcUrl) {
      return Response.json({ error: `No RPC found for chainId ${chainId}` }, { status: 400 })
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

    const factory = new ethers.Contract(FACTORY_ADDRESS, Create3FactoryArtifact.abi, wallet)

    const SmartAccountFactory = new ethers.ContractFactory(
      SmartAccountArtifact.abi,
      SmartAccountArtifact.bytecode,
      wallet
    )

    const creationTx = await SmartAccountFactory.getDeployTransaction(address, ethers.ZeroAddress)
    const bytecode = creationTx.data!
    const SALT = ethers.keccak256(ethers.toUtf8Bytes(salt))

    const tx = await factory.deploy(SALT, bytecode)
    const receipt = await tx.wait()

    const deployedAddress = await factory.getDeployed(wallet.address, SALT)

    const smartAccount = SmartAccountFactory.attach(deployedAddress) as unknown as SmartAccount

    return Response.json({
      deployed: deployedAddress,
      name: await smartAccount.walletName(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    })
  } catch (error: any) {
    console.error('Deployment error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}