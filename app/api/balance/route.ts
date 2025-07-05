import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')?.toLowerCase()
    const token = searchParams.get('token')?.toLowerCase()
    const chain = searchParams.get('chain')?.toLowerCase()

    const options = {
        method: 'GET',
        headers: {
          Authorization: 'Bearer eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODc3MTYwMzgsImp0aSI6IjQyMWVmMDIwLWFiYjYtNDEyMi1hMjFhLTcwOGJjOWE3MTJiZSIsImlhdCI6MTc1MTcxNjAzOCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbW9kdTdmNTUyMTRlYTViNzY3OGUiLCJ2IjoxLCJha2kiOiJhZWRmMjk0MGQ1ZDhjOTU3NWM4NjRkYzVhOTJiMzE0MTdlY2UzNmI1MzVlOGRiMWE2YjVmODU3MzFjZTY0NWMxIiwidWlkIjoiMG1vZHU3ZjU1MjE0ZWE1Yjc2NzhlIn0.CbtoA-dagXibGBAtVgGnnbEF8XwSUxRXTE3Xpxd-K9tjVJXd9id8mfXOT3zbHVgW0mSRSfgGK5HT2rfhxEVTdw'
        }
      };
      
    const res = await fetch(`https://token-api.thegraph.com/balances/evm/${address}?network_id=${chain}&contract=${token}&orderBy=timestamp&orderDirection=desc&limit=10&page=1`, options)
    const data = await res.json()


    return new Response(JSON.stringify({ amount: data.data.length === 0 ? 0 : formatUnitsToString(data.data[0].amount, token === '0x4200000000000000000000000000000000000006' ? 18 : 6) }), {
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