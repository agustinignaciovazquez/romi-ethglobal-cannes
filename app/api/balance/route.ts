import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.toLowerCase();
  const token = searchParams.get("token")?.toLowerCase();
  const chain = searchParams.get("chain")?.toLowerCase();

  if (!address || !token || !chain) {
    return new Response(JSON.stringify({ error: "Missing query params" }), {
      status: 400,
    });
  }

  let amount = BigInt(0);

  if (process.env.NEXT_PRIVATE_USE_ALCHEMY === "true") {
    try {
      const tokenBalances = await getTokenBalances(address, chain);
      const matching = tokenBalances.find((t: any) => t.contract.toLowerCase() === token);
      amount = matching ? matching.amount : 0;
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
      });
    }
  } else {
    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PRIVATE_TOKEN_API}`,
      },
    };

    const res = await fetch(
      `https://token-api.thegraph.com/balances/evm/${address}?network_id=${chain}&contract=${token}&orderBy=timestamp&orderDirection=desc&limit=10&page=1`,
      options
    );

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: `Graph API error: ${errorText}` }), {
        status: 500,
      });
    }

    const data = await res.json();
    amount = data.data?.[0]?.amount ? BigInt(data.data[0].amount) : BigInt(0);
  }

  const decimals = token === "0x4200000000000000000000000000000000000006" ? 18 : 6;

  return new Response(
    JSON.stringify({ amount: formatUnitsToString(amount, decimals) }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function formatUnitsToString(
  value: string | bigint | number,
  decimals: number
): string {
  const valueStr = String(value);
  if (valueStr.includes(".")) return valueStr;

  const len = valueStr.length;

  if (decimals === 0) return valueStr;

  if (len <= decimals) {
    const padded = valueStr.padStart(decimals, "0");
    return `0.${padded}`;
  }

  const intPart = valueStr.slice(0, len - decimals);
  const fracPart = valueStr.slice(len - decimals);
  return `${intPart}.${fracPart}`;
}

async function getTokenBalances(address: string, chain: string) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const url = `https://${chain === 'optimism' ? 'opt' : chain}-mainnet.g.alchemy.com/v2/${apiKey}`;

  const payload = {
    jsonrpc: "2.0",
    method: "alchemy_getTokenBalances",
    params: [address],
    id: 1,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch from Alchemy: ${errorText}`);
  }

  const result = await res.json();
  return result.result.tokenBalances
    .map((token: any) => ({
      contract: token.contractAddress,
      amount: BigInt(token.tokenBalance),
      network_id: chain,
    }))
    .filter(({ amount }: any) => amount > 0);
}