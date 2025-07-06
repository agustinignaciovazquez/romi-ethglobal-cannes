import { NextRequest } from 'next/server'

const CHAINS = [
  'base',
  'optimism'
]

const API_KEY = process.env.ALCHEMY_API_KEY
const BASE_URLS: Record<string, string> = {
  base: `https://base-mainnet.g.alchemy.com/v2/${API_KEY}`,
  optimism: `https://opt-mainnet.g.alchemy.com/v2/${API_KEY}`
}

async function getTransfers(address: string, chain: string) {
  console.log(`Fetching transfers for address: ${address} on chain: ${chain}`)

  const baseUrl = BASE_URLS[chain]
  const headers = { 'Content-Type': 'application/json' }

  const bodyFrom = {
    jsonrpc: '2.0',
    id: 1,
    method: 'alchemy_getAssetTransfers',
    params: [
      {
        fromAddress: address,
        category: ['erc20'],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: '0x14' // 20 in hex
      }
    ]
  }

  const bodyTo = {
    jsonrpc: '2.0',
    id: 2,
    method: 'alchemy_getAssetTransfers',
    params: [
      {
        toAddress: address,
        category: ['erc20'],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: '0x14' // 20 in hex
      }
    ]
  }

  const [resFrom, resTo] = await Promise.all([
    fetch(baseUrl, { method: 'POST', headers, body: JSON.stringify(bodyFrom) }),
    fetch(baseUrl, { method: 'POST', headers, body: JSON.stringify(bodyTo) })
  ])

  const [dataFrom, dataTo] = await Promise.all([resFrom.json(), resTo.json()])
  return [...(dataFrom.result.transfers || []), ...(dataTo.result.transfers || [])]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')?.toLowerCase()

  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing address param' }), { status: 400 })
  }

  const allTransfers = (
    await Promise.all(
      CHAINS.map(async (chain) => {
        const transfers = await getTransfers(address, chain)
        return transfers.map((t: any) => ({ ...t, chain_id: chain }))
      })
    )
  ).flat()
  const groupedByTx = new Map()

  for (const tx of allTransfers) {
    const key = `${tx.blockNum}_${tx.hash}`
    if (!groupedByTx.has(key)) groupedByTx.set(key, [])
    groupedByTx.get(key).push(tx)
  }

  const result = []
  for (const group of groupedByTx.values()) {
    const hasFrom = group.some((t: any) => t.from.toLowerCase() === address)
    const hasTo = group.some((t: any) => t.to.toLowerCase() === address)

    if (group.length > 1 && hasFrom && hasTo) {
      const fromToken = group.find((t: any) => t.from.toLowerCase() === address)
      const toToken = group.find((t: any) => t.to.toLowerCase() === address)

      if (fromToken && toToken) {
        result.push({
          type: 'swap',
          timestamp: Date.parse(fromToken.metadata.blockTimestamp) / 1000,
          datetime: fromToken.metadata.blockTimestamp,
          transaction_id: fromToken.hash,
          block_num: parseInt(fromToken.blockNum),
          from_token: fromToken.asset,
          to_token: toToken.asset,
          from_value: fromToken.value,
          to_value: toToken.value,
          chain_id: fromToken.chain_id,
        })
        continue
      }
    }

    for (const t of group) {
      const isSender = t.from.toLowerCase() === address
      const isReceiver = t.to.toLowerCase() === address

      if (isSender) {
        result.push({
          type: 'send',
          timestamp: Date.parse(t.metadata.blockTimestamp) / 1000,
          datetime: t.metadata.blockTimestamp,
          transaction_id: t.hash,
          block_num: parseInt(t.blockNum),
          from_token: t.asset,
          from_value: t.value,
          chain_id: t.chain_id,
        })
      } else if (isReceiver) {
        result.push({
          type: 'receive',
          timestamp: Date.parse(t.metadata.blockTimestamp) / 1000,
          datetime: t.metadata.blockTimestamp,
          transaction_id: t.hash,
          block_num: parseInt(t.blockNum),
          from_token: t.asset,
          from_value: t.value,
          chain_id: t.chain_id,
        })
      }
    }
  }

  result.sort((a, b) => b.timestamp - a.timestamp)

  return new Response(JSON.stringify({ data: result }), {
    headers: { 'Content-Type': 'application/json' },
  })
}