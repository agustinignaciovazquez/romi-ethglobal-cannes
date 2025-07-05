// app/api/activity/route.ts
import { NextRequest } from 'next/server'

const CHAINS = [
  'base',
]

const API_URL = 'https://token-api.thegraph.com/transfers/evm'
const API_KEY = 'eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODc3MTYwMzgsImp0aSI6IjQyMWVmMDIwLWFiYjYtNDEyMi1hMjFhLTcwOGJjOWE3MTJiZSIsImlhdCI6MTc1MTcxNjAzOCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbW9kdTdmNTUyMTRlYTViNzY3OGUiLCJ2IjoxLCJha2kiOiJhZWRmMjk0MGQ1ZDhjOTU3NWM4NjRkYzVhOTJiMzE0MTdlY2UzNmI1MzVlOGRiMWE2YjVmODU3MzFjZTY0NWMxIiwidWlkIjoiMG1vZHU3ZjU1MjE0ZWE1Yjc2NzhlIn0.CbtoA-dagXibGBAtVgGnnbEF8XwSUxRXTE3Xpxd-K9tjVJXd9id8mfXOT3zbHVgW0mSRSfgGK5HT2rfhxEVTdw'

async function getTransfers(address: string, chain: string) {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    }
  
    const [fromRes, toRes] = await Promise.all([
      fetch(`${API_URL}?network_id=${chain}&from=${address}&orderBy=timestamp&orderDirection=desc&limit=20`, { headers }),
      fetch(`${API_URL}?network_id=${chain}&to=${address}&orderBy=timestamp&orderDirection=desc&limit=20`, { headers }),
    ])
  
    const [fromData, toData] = await Promise.all([fromRes.json(), toRes.json()])
  
    return [...fromData.data, ...toData.data]
  }
  
  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')?.toLowerCase()
  
    if (!address) {
      return new Response(JSON.stringify({ error: 'Missing address param' }), { status: 400 })
    }
  
    const allTransfers = (await Promise.all(
      CHAINS.map((chain) => getTransfers(address, chain))
    )).flat()
  
    const groupedByTx = new Map()
  
    for (const tx of allTransfers) {
      const key = `${tx.block_num}_${tx.transaction_id}`
      if (!groupedByTx.has(key)) groupedByTx.set(key, [])
      groupedByTx.get(key).push(tx)
    }
  
    const result = []
    for (const group of groupedByTx.values()) {
      const hasFrom = group.some((t: { from: string }) => t.from === address)
      const hasTo = group.some((t: { to: string }) => t.to === address)
  
      if (group.length > 1 && hasFrom && hasTo) {
        const fromToken = group.find((t: { from: string }) => t.from === address)
        const toToken = group.find((t: { to: string }) => t.to === address)
  
        if (fromToken && toToken) {
          result.push({
            type: 'swap',
            timestamp: fromToken.timestamp,
            datetime: fromToken.datetime,
            transaction_id: fromToken.transaction_id,
            block_num: fromToken.block_num,
            from_token: fromToken.symbol,
            to_token: toToken.symbol,
            from_value: formatUnitsToString(fromToken.value, fromToken.decimals),
            to_value: formatUnitsToString(toToken.value, toToken.decimals),
          })
          continue
        }
      }
  
      for (const t of group) {
        if (t.from === address) {
          result.push({
            type: 'send',
            ...t,
            from_token: t.symbol,
            from_value: formatUnitsToString(t.value, t.decimals),
          })
        } else if (t.to === address) {
          result.push({
            type: 'receive',
            ...t,
            from_token: t.symbol,
            from_value: formatUnitsToString(t.value, t.decimals),
          })
        }
      }
    }
  
    result.sort((a, b) => b.timestamp - a.timestamp)
  
    return new Response(JSON.stringify({ data: result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  export function formatUnitsToString(value: string | bigint | number, decimals: number): string {
    const valueStr = String(value);
  
    // If value is already a float string, return it as-is
    if (valueStr.includes('.')) return valueStr;
  
    const len = valueStr.length;
  
    if (decimals === 0) return valueStr;
  
    if (len <= decimals) {
      const padded = valueStr.padStart(decimals, '0');
      return `0.${padded}`;
    }
  
    const intPart = valueStr.slice(0, len - decimals);
    const fracPart = valueStr.slice(len - decimals);
    return `${intPart}.${fracPart}`;
  }