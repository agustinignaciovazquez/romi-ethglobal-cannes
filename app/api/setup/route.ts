// app/api/setup/route.ts
import type { NextRequest } from 'next/server'
import { ethers } from 'ethers'
import SmartAccountArtifact from '@/artifacts/contracts/romi/RomiSmartAccount.sol/RomiSmartAccount.json'
import Create3FactoryArtifact from '@/artifacts/contracts/romi/RomiFactory.sol/RomiFactory.json'
import { chains } from '../../../lib/data'
import { shouldAttemptENSRegistration, getChainName } from '../../../lib/chain-utils'

const ROOT_DOMAIN = ".toromi.eth"
const PRIVATE_KEY = process.env.NEXT_PRIVATE_PK!
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address, salt, config, signature, ensName } = body

    if (!address || !salt) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    let deployedAddress;
    let registeredENS = null;

    for (const chain of chains) {
      const rpcUrl = process.env[`NEXT_PUBLIC_${chain.chainId}_RPC_URL`]
      if (!rpcUrl) {
        return Response.json({ error: `No RPC found for chainId ${chain.chainId}` }, { status: 400 })
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

      const factory = new ethers.Contract(FACTORY_ADDRESS, Create3FactoryArtifact.abi, wallet)

      const SmartAccountFactory = new ethers.ContractFactory(
        SmartAccountArtifact.abi,
        SmartAccountArtifact.bytecode,
        wallet
      )
      // 0x111111125421cA6dc452d289314280a0f8842A65 -> 1inch router address
      const creationTx = await SmartAccountFactory.getDeployTransaction(address, 0, '0x111111125421cA6dc452d289314280a0f8842A65')
      const bytecode = creationTx.data!
      const SALT = ethers.keccak256(ethers.toUtf8Bytes(salt))

      // Check if this chain supports ENS registration and user requested it
      const shouldRegisterENS = shouldAttemptENSRegistration(chain.chainId, ensName);

      let tx;
      if (shouldRegisterENS) {
        // Check if factory has L2Registrar before attempting ENS registration
        try {
          const hasRegistrar = await factory.hasL2Registrar();
          if (hasRegistrar) {
            // Deploy with ENS registration on Base chains
            tx = await factory.deployWithENS(SALT, bytecode, ensName, address);
            registeredENS = ensName;
            console.log(`Smart Account deployed with ENS name: ${ensName} on ${getChainName(chain.chainId)}`);
          } else {
            console.log(`Warning: Factory has no L2Registrar on ${getChainName(chain.chainId)}, deploying without ENS`);
            tx = await factory.deploy(SALT, bytecode);
          }
        } catch (error) {
          console.error(`ENS registration failed on ${getChainName(chain.chainId)}:`, error);
          // Fall back to regular deployment
          tx = await factory.deploy(SALT, bytecode);
        }
      } else {
        // Deploy without ENS registration
        tx = await factory.deploy(SALT, bytecode);
        if (ensName) {
          console.log(`ENS name ${ensName} requested but ${getChainName(chain.chainId)} doesn't support ENS registration`);
        }
      }

      await tx.wait()

      if (!deployedAddress) {
        deployedAddress = await factory.getDeployed(wallet.address, SALT)
      }

      const smartAccount = new ethers.Contract(deployedAddress, SmartAccountArtifact.abi, wallet)

      console.log('Smart Account deployed at:', deployedAddress)

      await smartAccount.updateConfigWithSig(config.token, BigInt(config.chainId), BigInt(config.nonce), signature)
    }

    return Response.json({
      deployed: deployedAddress,
      ensName: registeredENS ? `${registeredENS}${ROOT_DOMAIN}` : null,
    })
  } catch (error: any) {
    console.error('Deployment error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
