import assert from "assert";

import { Log } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { Overrides } from "@ethersproject/contracts";

import { _GivetyContract, _TypedGivetyContract, _TypedLogDescription } from "../src/contracts";
import { log } from "./deploy";

const factoryAbi = [
  "function createPair(address tokenA, address tokenB) returns (address pair)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const factoryAddress = "0x6534610a504006670fF5efD6A838Ae171B8dad71";

const hasFactory = (chainId: number) => [1, 3, 4, 5, 42, 588].includes(chainId);

interface GiveSwapFactory
  extends _TypedGivetyContract<
    unknown,
    { createPair(tokenA: string, tokenB: string, _overrides?: Overrides): Promise<string> }
  > {
  extractEvents(
    logs: Log[],
    name: "PairCreated"
  ): _TypedLogDescription<{ token0: string; token1: string; pair: string }>[];
}

export const createGiveSwapPair = async (
  signer: Signer,
  tokenA: string,
  tokenB: string,
  overrides?: Overrides
): Promise<string> => {
  const chainId = await signer.getChainId();

  if (!hasFactory(chainId)) {
    throw new Error(`GiveSwapFactory is not deployed on this network (chainId = ${chainId})`);
  }

  const factory = (new _GivetyContract(
    factoryAddress,
    factoryAbi,
    signer
  ) as unknown) as GiveSwapFactory;

  log(`Creating GiveSwap GIVE <=> GUSD pair...`);

  const tx = await factory.createPair(tokenA, tokenB, { ...overrides });
  const receipt = await tx.wait();
  const pairCreatedEvents = factory.extractEvents(receipt.logs, "PairCreated");

  assert(pairCreatedEvents.length === 1);
  return pairCreatedEvents[0].args.pair;
};
