import { Decimal } from "givety-lib-base";

type GiveSwapResponse = {
  data?: {
    bundle: {
      ethPrice: string;
    } | null;
    token: {
      derivedETH: string;
    } | null;
    pair: {
      reserveUSD: string;
      totalSupply: string;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const giveswapQuery = (gvtyTokenAddress: string, givTokenAddress: string) => `{
  token(id: "${gvtyTokenAddress.toLowerCase()}") {
    derivedETH
  },
  bundle(id: 1) {
    ethPrice
  },
  pair(id: "${givTokenAddress.toLowerCase()}") {
    totalSupply
    reserveUSD
  }
}`;

export async function fetchPrices(gvtyTokenAddress: string, givTokenAddress: string) {
  const response = await window.fetch("https://api.thegraph.com/subgraphs/name/giveswap/giveswap-v2", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: giveswapQuery(gvtyTokenAddress, givTokenAddress),
      variables: null
    })
  });

  if (!response.ok) {
    return Promise.reject("Network error connecting to GiveSwap subgraph");
  }

  const { data, errors }: GiveSwapResponse = await response.json();

  if (errors) {
    return Promise.reject(errors);
  }

  if (
    typeof data?.token?.derivedETH === "string" &&
    typeof data?.pair?.reserveUSD === "string" &&
    typeof data?.pair?.totalSupply === "string" &&
    typeof data?.bundle?.ethPrice === "string"
  ) {
    const ethPriceUSD = Decimal.from(data.bundle.ethPrice);
    const gvtyPriceUSD = Decimal.from(data.token.derivedETH).mul(ethPriceUSD);
    const uniLpPriceUSD = Decimal.from(data.pair.reserveUSD).div(
      Decimal.from(data.pair.totalSupply)
    );

    return { gvtyPriceUSD, uniLpPriceUSD };
  }

  return Promise.reject("GiveSwap doesn't have the required data to calculate yield");
}
