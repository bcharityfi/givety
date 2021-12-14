import { Decimal } from "givety-lib-base";

type GiveSwapResponse = {
  data?: {
    bundle: {
      ethPrice: string;
    } | null;
    token: {
      derivedETH: string;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const giveswapQuery = (gvtyTokenAddress: string) => `{
  token(id: "${gvtyTokenAddress.toLowerCase()}") {
    derivedETH
  },
  bundle(id: 1) {
    ethPrice
  },
}`;

export async function fetchGvtyPrice(gvtyTokenAddress: string) {
  const response = await window.fetch("https://api.thegraph.com/subgraphs/name/giveswap/giveswap-v2", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      query: giveswapQuery(gvtyTokenAddress),
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

  if (typeof data?.token?.derivedETH === "string" && typeof data?.bundle?.ethPrice === "string") {
    const ethPriceUSD = Decimal.from(data.bundle.ethPrice);
    const gvtyPriceUSD = Decimal.from(data.token.derivedETH).mul(ethPriceUSD);

    return { gvtyPriceUSD };
  }

  return Promise.reject("GiveSwap doesn't have the required data to calculate yield");
}
