import { JsonFragment, LogDescription } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { Log } from "@ethersproject/abstract-provider";

import {
  Contract,
  ContractInterface,
  ContractFunction,
  Overrides,
  CallOverrides,
  PopulatedTransaction,
  ContractTransaction
} from "@ethersproject/contracts";

import activePoolAbi from "../abi/ActivePool.json";
import borrowerOperationsAbi from "../abi/BorrowerOperations.json";
import troveManagerAbi from "../abi/TroveManager.json";
import gusdTokenAbi from "../abi/GUSDToken.json";
import collSurplusPoolAbi from "../abi/CollSurplusPool.json";
import communityIssuanceAbi from "../abi/CommunityIssuance.json";
import defaultPoolAbi from "../abi/DefaultPool.json";
import gvtyTokenAbi from "../abi/GVTYToken.json";
import hintHelpersAbi from "../abi/HintHelpers.json";
import lockupContractFactoryAbi from "../abi/LockupContractFactory.json";
import gvtyStakingAbi from "../abi/GVTYStaking.json";
import multiTroveGetterAbi from "../abi/MultiTroveGetter.json";
import priceFeedAbi from "../abi/PriceFeed.json";
import priceFeedTestnetAbi from "../abi/PriceFeedTestnet.json";
import sortedTrovesAbi from "../abi/SortedTroves.json";
import stabilityPoolAbi from "../abi/StabilityPool.json";
import gasPoolAbi from "../abi/GasPool.json";
import givpoolAbi from "../abi/Givpool.json";
import iERC20Abi from "../abi/IERC20.json";
import erc20MockAbi from "../abi/ERC20Mock.json";

import {
  ActivePool,
  BorrowerOperations,
  TroveManager,
  GUSDToken,
  CollSurplusPool,
  CommunityIssuance,
  DefaultPool,
  GVTYToken,
  HintHelpers,
  LockupContractFactory,
  GVTYStaking,
  MultiTroveGetter,
  PriceFeed,
  PriceFeedTestnet,
  SortedTroves,
  StabilityPool,
  GasPool,
  Givpool,
  ERC20Mock,
  IERC20
} from "../types";

import { EthersProvider, EthersSigner } from "./types";

export interface _TypedLogDescription<T> extends Omit<LogDescription, "args"> {
  args: T;
}

type BucketOfFunctions = Record<string, (...args: unknown[]) => never>;

// Removes unsafe index signatures from an Ethers contract type
export type _TypeSafeContract<T> = Pick<
  T,
  {
    [P in keyof T]: BucketOfFunctions extends T[P] ? never : P;
  } extends {
    [_ in keyof T]: infer U;
  }
    ? U
    : never
>;

type EstimatedContractFunction<R = unknown, A extends unknown[] = unknown[], O = Overrides> = (
  overrides: O,
  adjustGas: (gas: BigNumber) => BigNumber,
  ...args: A
) => Promise<R>;

type CallOverridesArg = [overrides?: CallOverrides];

type TypedContract<T extends Contract, U, V> = _TypeSafeContract<T> &
  U &
  {
    [P in keyof V]: V[P] extends (...args: infer A) => unknown
      ? (...args: A) => Promise<ContractTransaction>
      : never;
  } & {
    readonly callStatic: {
      [P in keyof V]: V[P] extends (...args: [...infer A, never]) => infer R
        ? (...args: [...A, ...CallOverridesArg]) => R
        : never;
    };

    readonly estimateGas: {
      [P in keyof V]: V[P] extends (...args: infer A) => unknown
        ? (...args: A) => Promise<BigNumber>
        : never;
    };

    readonly populateTransaction: {
      [P in keyof V]: V[P] extends (...args: infer A) => unknown
        ? (...args: A) => Promise<PopulatedTransaction>
        : never;
    };

    readonly estimateAndPopulate: {
      [P in keyof V]: V[P] extends (...args: [...infer A, infer O | undefined]) => unknown
        ? EstimatedContractFunction<PopulatedTransaction, A, O>
        : never;
    };
  };

const buildEstimatedFunctions = <T>(
  estimateFunctions: Record<string, ContractFunction<BigNumber>>,
  functions: Record<string, ContractFunction<T>>
): Record<string, EstimatedContractFunction<T>> =>
  Object.fromEntries(
    Object.keys(estimateFunctions).map(functionName => [
      functionName,
      async (overrides, adjustEstimate, ...args) => {
        if (overrides.gasLimit === undefined) {
          const estimatedGas = await estimateFunctions[functionName](...args, overrides);

          overrides = {
            ...overrides,
            gasLimit: adjustEstimate(estimatedGas)
          };
        }

        return functions[functionName](...args, overrides);
      }
    ])
  );

export class _GivetyContract extends Contract {
  readonly estimateAndPopulate: Record<string, EstimatedContractFunction<PopulatedTransaction>>;

  constructor(
    addressOrName: string,
    contractInterface: ContractInterface,
    signerOrProvider?: EthersSigner | EthersProvider
  ) {
    super(addressOrName, contractInterface, signerOrProvider);

    // this.estimateAndCall = buildEstimatedFunctions(this.estimateGas, this);
    this.estimateAndPopulate = buildEstimatedFunctions(this.estimateGas, this.populateTransaction);
  }

  extractEvents(logs: Log[], name: string): _TypedLogDescription<unknown>[] {
    return logs
      .filter(log => log.address === this.address)
      .map(log => this.interface.parseLog(log))
      .filter(e => e.name === name);
  }
}

/** @internal */
export type _TypedGivetyContract<T = unknown, U = unknown> = TypedContract<_GivetyContract, T, U>;

/** @internal */
export interface _GivetyContracts {
  activePool: ActivePool;
  borrowerOperations: BorrowerOperations;
  troveManager: TroveManager;
  gusdToken: GUSDToken;
  collSurplusPool: CollSurplusPool;
  communityIssuance: CommunityIssuance;
  defaultPool: DefaultPool;
  gvtyToken: GVTYToken;
  hintHelpers: HintHelpers;
  lockupContractFactory: LockupContractFactory;
  gvtyStaking: GVTYStaking;
  multiTroveGetter: MultiTroveGetter;
  priceFeed: PriceFeed | PriceFeedTestnet;
  sortedTroves: SortedTroves;
  stabilityPool: StabilityPool;
  gasPool: GasPool;
  givpool: Givpool;
  givToken: IERC20 | ERC20Mock;
}

/** @internal */
export const _priceFeedIsTestnet = (
  priceFeed: PriceFeed | PriceFeedTestnet
): priceFeed is PriceFeedTestnet => "setPrice" in priceFeed;

/** @internal */
export const _givTokenIsMock = (givToken: IERC20 | ERC20Mock): givToken is ERC20Mock =>
  "mint" in givToken;

type GivetyContractsKey = keyof _GivetyContracts;

/** @internal */
export type _GivetyContractAddresses = Record<GivetyContractsKey, string>;

type GivetyContractAbis = Record<GivetyContractsKey, JsonFragment[]>;

const getAbi = (priceFeedIsTestnet: boolean, givTokenIsMock: boolean): GivetyContractAbis => ({
  activePool: activePoolAbi,
  borrowerOperations: borrowerOperationsAbi,
  troveManager: troveManagerAbi,
  gusdToken: gusdTokenAbi,
  communityIssuance: communityIssuanceAbi,
  defaultPool: defaultPoolAbi,
  gvtyToken: gvtyTokenAbi,
  hintHelpers: hintHelpersAbi,
  lockupContractFactory: lockupContractFactoryAbi,
  gvtyStaking: gvtyStakingAbi,
  multiTroveGetter: multiTroveGetterAbi,
  priceFeed: priceFeedIsTestnet ? priceFeedTestnetAbi : priceFeedAbi,
  sortedTroves: sortedTrovesAbi,
  stabilityPool: stabilityPoolAbi,
  gasPool: gasPoolAbi,
  collSurplusPool: collSurplusPoolAbi,
  givpool: givpoolAbi,
  givToken: givTokenIsMock ? erc20MockAbi : iERC20Abi
});

const mapGivetyContracts = <T, U>(
  contracts: Record<GivetyContractsKey, T>,
  f: (t: T, key: GivetyContractsKey) => U
) =>
  Object.fromEntries(
    Object.entries(contracts).map(([key, t]) => [key, f(t, key as GivetyContractsKey)])
  ) as Record<GivetyContractsKey, U>;

/** @internal */
export interface _GivetyDeploymentJSON {
  readonly chainId: number;
  readonly addresses: _GivetyContractAddresses;
  readonly version: string;
  readonly deploymentDate: number;
  readonly startBlock: number;
  readonly bootstrapPeriod: number;
  readonly totalStabilityPoolGVTYReward: string;
  readonly liquidityMiningGVTYRewardRate: string;
  readonly _priceFeedIsTestnet: boolean;
  readonly _givTokenIsMock: boolean;
  readonly _isDev: boolean;
}

/** @internal */
export const _connectToContracts = (
  signerOrProvider: EthersSigner | EthersProvider,
  { addresses, _priceFeedIsTestnet, _givTokenIsMock }: _GivetyDeploymentJSON
): _GivetyContracts => {
  const abi = getAbi(_priceFeedIsTestnet, _givTokenIsMock);

  return mapGivetyContracts(
    addresses,
    (address, key) =>
      new _GivetyContract(address, abi[key], signerOrProvider) as _TypedGivetyContract
  ) as _GivetyContracts;
};
