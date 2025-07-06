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
const L2_REGISTRAR_ADDRESS = process.env.NEXT_PUBLIC_L2_REGISTRAR_ADDRESS

// L2Registrar ABI - only the functions we need
const L2_REGISTRAR_ABI = [
  "function register(string calldata label, address nameOwner) external",
  "function available(string calldata label) external view returns (bool)"
];

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
      const creationTx = await SmartAccountFactory.getDeployTransaction(address, 0, '0x111111125421cA6dc452d289314280a0f8842A65', chain.chainLinkRouter)
      const bytecode = creationTx.data!
      const SALT = ethers.keccak256(ethers.toUtf8Bytes(salt))

      // Check if this chain supports ENS registration and user requested it
      const shouldRegisterENS = shouldAttemptENSRegistration(chain.chainId, ensName);

      // Always deploy using the regular deploy function (no more deployWithENS)
      const tx = await factory.deploy(SALT, bytecode);
      await tx.wait();

      if (!deployedAddress) {
        deployedAddress = await factory.getDeployed(wallet.address, SALT);
      }

      // Handle ENS registration separately if supported and requested
      if (shouldRegisterENS && L2_REGISTRAR_ADDRESS) {
        try {
          const l2Registrar = new ethers.Contract(L2_REGISTRAR_ADDRESS, L2_REGISTRAR_ABI, wallet);

          // Check if the ENS name is available
          const isAvailable = await l2Registrar.available(ensName);

          if (isAvailable) {
            // Register the ENS name to point to the deployed smart account
            const registerTx = await l2Registrar.register(ensName, deployedAddress);
            await registerTx.wait();
            registeredENS = ensName;
            console.log(`ENS name ${ensName} registered for address ${deployedAddress} on ${getChainName(chain.chainId)}`);
          } else {
            console.log(`ENS name ${ensName} is not available on ${getChainName(chain.chainId)}`);
          }
        } catch (error) {
          console.error(`ENS registration failed on ${getChainName(chain.chainId)}:`, error);
          // Continue without ENS registration
        }
      } else if (ensName && shouldRegisterENS) {
        console.log(`ENS registration requested but L2_REGISTRAR_ADDRESS not configured for ${getChainName(chain.chainId)}`);
      } else if (ensName) {
        console.log(`ENS name ${ensName} requested but ${getChainName(chain.chainId)} doesn't support ENS registration`);
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
