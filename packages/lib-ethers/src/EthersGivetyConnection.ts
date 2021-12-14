import { Block, BlockTag } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";

import { Decimal } from "givety-lib-base";

import devOrNull from "../deployments/dev.json";
import goerli from "../deployments/goerli.json";
import kovan from "../deployments/kovan.json";
import rinkeby from "../deployments/rinkeby.json";
import ropsten from "../deployments/ropsten.json";
import mainnet from "../deployments/mainnet.json";
import Stardust from "../deployments/Stardust.json";

import { numberify, panic } from "./_utils";
import { EthersProvider, EthersSigner } from "./types";

import {
  _connectToContracts,
  _GivetyContractAddresses,
  _GivetyContracts,
  _GivetyDeploymentJSON
} from "./contracts";

import { _connectToMulticall, _Multicall } from "./_Multicall";

const dev = devOrNull as _GivetyDeploymentJSON | null;

const deployments: {
  [chainId: number]: _GivetyDeploymentJSON | undefined;
} = {
  [mainnet.chainId]: mainnet,
  [ropsten.chainId]: ropsten,
  [rinkeby.chainId]: rinkeby,
  [goerli.chainId]: goerli,
  [kovan.chainId]: kovan,
  [Stardust.chainId]: Stardust,

  ...(dev !== null ? { [dev.chainId]: dev } : {})
};

declare const brand: unique symbol;

const branded = <T>(t: Omit<T, typeof brand>): T => t as T;

/**
 * Information about a connection to the Givety protocol.
 *
 * @remarks
 * Provided for debugging / informational purposes.
 *
 * Exposed through {@link ReadableEthersGivety.connection} and {@link EthersGivety.connection}.
 *
 * @public
 */
export interface EthersGivetyConnection extends EthersGivetyConnectionOptionalParams {
  /** Ethers `Provider` used for connecting to the network. */
  readonly provider: EthersProvider;

  /** Ethers `Signer` used for sending transactions. */
  readonly signer?: EthersSigner;

  /** Chain ID of the connected network. */
  readonly chainId: number;

  /** Version of the Givety contracts (Git commit hash). */
  readonly version: string;

  /** Date when the Givety contracts were deployed. */
  readonly deploymentDate: Date;

  /** Number of block in which the first Givety contract was deployed. */
  readonly startBlock: number;

  /** Time period (in seconds) after `deploymentDate` during which redemptions are disabled. */
  readonly bootstrapPeriod: number;

  /** Total amount of GVTY allocated for rewarding stability depositors. */
  readonly totalStabilityPoolGVTYReward: Decimal;

  /** Amount of GVTY collectively rewarded to stakers of the liquidity mining pool per second. */
  readonly liquidityMiningGVTYRewardRate: Decimal;

  /** A mapping of Givety contracts' names to their addresses. */
  readonly addresses: Record<string, string>;

  /** @internal */
  readonly _priceFeedIsTestnet: boolean;

  /** @internal */
  readonly _isDev: boolean;

  /** @internal */
  readonly [brand]: unique symbol;
}

/** @internal */
export interface _InternalEthersGivetyConnection extends EthersGivetyConnection {
  readonly addresses: _GivetyContractAddresses;
  readonly _contracts: _GivetyContracts;
  readonly _multicall?: _Multicall;
}

const connectionFrom = (
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  _contracts: _GivetyContracts,
  _multicall: _Multicall | undefined,
  {
    deploymentDate,
    totalStabilityPoolGVTYReward,
    liquidityMiningGVTYRewardRate,
    ...deployment
  }: _GivetyDeploymentJSON,
  optionalParams?: EthersGivetyConnectionOptionalParams
): _InternalEthersGivetyConnection => {
  if (
    optionalParams &&
    optionalParams.useStore !== undefined &&
    !validStoreOptions.includes(optionalParams.useStore)
  ) {
    throw new Error(`Invalid useStore value ${optionalParams.useStore}`);
  }

  return branded({
    provider,
    signer,
    _contracts,
    _multicall,
    deploymentDate: new Date(deploymentDate),
    totalStabilityPoolGVTYReward: Decimal.from(totalStabilityPoolGVTYReward),
    liquidityMiningGVTYRewardRate: Decimal.from(liquidityMiningGVTYRewardRate),
    ...deployment,
    ...optionalParams
  });
};

/** @internal */
export const _getContracts = (connection: EthersGivetyConnection): _GivetyContracts =>
  (connection as _InternalEthersGivetyConnection)._contracts;

const getMulticall = (connection: EthersGivetyConnection): _Multicall | undefined =>
  (connection as _InternalEthersGivetyConnection)._multicall;

const getTimestampFromBlock = ({ timestamp }: Block) => timestamp;

/** @internal */
export const _getBlockTimestamp = (
  connection: EthersGivetyConnection,
  blockTag: BlockTag = "latest"
): Promise<number> =>
  // Get the timestamp via a contract call whenever possible, to make it batchable with other calls
  getMulticall(connection)?.getCurrentBlockTimestamp({ blockTag }).then(numberify) ??
  _getProvider(connection).getBlock(blockTag).then(getTimestampFromBlock);

/** @internal */
export const _requireSigner = (connection: EthersGivetyConnection): EthersSigner =>
  connection.signer ?? panic(new Error("Must be connected through a Signer"));

/** @internal */
export const _getProvider = (connection: EthersGivetyConnection): EthersProvider =>
  connection.provider;

// TODO parameterize error message?
/** @internal */
export const _requireAddress = (
  connection: EthersGivetyConnection,
  overrides?: { from?: string }
): string =>
  overrides?.from ?? connection.userAddress ?? panic(new Error("A user address is required"));

/** @internal */
export const _requireFrontendAddress = (connection: EthersGivetyConnection): string =>
  connection.frontendTag ?? panic(new Error("A frontend address is required"));

/** @internal */
export const _usingStore = (
  connection: EthersGivetyConnection
): connection is EthersGivetyConnection & { useStore: EthersGivetyStoreOption } =>
  connection.useStore !== undefined;

/**
 * Thrown when trying to connect to a network where Givety is not deployed.
 *
 * @remarks
 * Thrown by {@link ReadableEthersGivety.(connect:2)} and {@link EthersGivety.(connect:2)}.
 *
 * @public
 */
export class UnsupportedNetworkError extends Error {
  /** Chain ID of the unsupported network. */
  readonly chainId: number;

  /** @internal */
  constructor(chainId: number) {
    super(`Unsupported network (chainId = ${chainId})`);
    this.name = "UnsupportedNetworkError";
    this.chainId = chainId;
  }
}

const getProviderAndSigner = (
  signerOrProvider: EthersSigner | EthersProvider
): [provider: EthersProvider, signer: EthersSigner | undefined] => {
  const provider: EthersProvider = Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider ?? panic(new Error("Signer must have a Provider"))
    : signerOrProvider;

  const signer = Signer.isSigner(signerOrProvider) ? signerOrProvider : undefined;

  return [provider, signer];
};

/** @internal */
export const _connectToDeployment = (
  deployment: _GivetyDeploymentJSON,
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersGivetyConnectionOptionalParams
): EthersGivetyConnection =>
  connectionFrom(
    ...getProviderAndSigner(signerOrProvider),
    _connectToContracts(signerOrProvider, deployment),
    undefined,
    deployment,
    optionalParams
  );

/**
 * Possible values for the optional
 * {@link EthersGivetyConnectionOptionalParams.useStore | useStore}
 * connection parameter.
 *
 * @remarks
 * Currently, the only supported value is `"blockPolled"`, in which case a
 * {@link BlockPolledGivetyStore} will be created.
 *
 * @public
 */
export type EthersGivetyStoreOption = "blockPolled";

const validStoreOptions = ["blockPolled"];

/**
 * Optional parameters of {@link ReadableEthersGivety.(connect:2)} and
 * {@link EthersGivety.(connect:2)}.
 *
 * @public
 */
export interface EthersGivetyConnectionOptionalParams {
  /**
   * Address whose Trove, Stability Deposit, GVTY Stake and balances will be read by default.
   *
   * @remarks
   * For example {@link EthersGivety.getTrove | getTrove(address?)} will return the Trove owned by
   * `userAddress` when the `address` parameter is omitted.
   *
   * Should be omitted when connecting through a {@link EthersSigner | Signer}. Instead `userAddress`
   * will be automatically determined from the `Signer`.
   */
  readonly userAddress?: string;

  /**
   * Address that will receive GVTY rewards from newly created Stability Deposits by default.
   *
   * @remarks
   * For example
   * {@link EthersGivety.depositGUSDInStabilityPool | depositGUSDInStabilityPool(amount, frontendTag?)}
   * will tag newly made Stability Deposits with this address when its `frontendTag` parameter is
   * omitted.
   */
  readonly frontendTag?: string;

  /**
   * Create a {@link givety-lib-base#GivetyStore} and expose it as the `store` property.
   *
   * @remarks
   * When set to one of the available {@link EthersGivetyStoreOption | options},
   * {@link ReadableEthersGivety.(connect:2) | ReadableEthersGivety.connect()} will return a
   * {@link ReadableEthersGivetyWithStore}, while
   * {@link EthersGivety.(connect:2) | EthersGivety.connect()} will return an
   * {@link EthersGivetyWithStore}.
   *
   * Note that the store won't start monitoring the blockchain until its
   * {@link givety-lib-base#GivetyStore.start | start()} function is called.
   */
  readonly useStore?: EthersGivetyStoreOption;
}

/** @internal */
export function _connectByChainId<T>(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams: EthersGivetyConnectionOptionalParams & { useStore: T }
): EthersGivetyConnection & { useStore: T };

/** @internal */
export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersGivetyConnectionOptionalParams
): EthersGivetyConnection;

/** @internal */
export function _connectByChainId(
  provider: EthersProvider,
  signer: EthersSigner | undefined,
  chainId: number,
  optionalParams?: EthersGivetyConnectionOptionalParams
): EthersGivetyConnection {
  const deployment: _GivetyDeploymentJSON =
    deployments[chainId] ?? panic(new UnsupportedNetworkError(chainId));

  return connectionFrom(
    provider,
    signer,
    _connectToContracts(signer ?? provider, deployment),
    _connectToMulticall(signer ?? provider, chainId),
    deployment,
    optionalParams
  );
}

/** @internal */
export const _connect = async (
  signerOrProvider: EthersSigner | EthersProvider,
  optionalParams?: EthersGivetyConnectionOptionalParams
): Promise<EthersGivetyConnection> => {
  const [provider, signer] = getProviderAndSigner(signerOrProvider);

  if (signer) {
    if (optionalParams?.userAddress !== undefined) {
      throw new Error("Can't override userAddress when connecting through Signer");
    }

    optionalParams = {
      ...optionalParams,
      userAddress: await signer.getAddress()
    };
  }

  return _connectByChainId(provider, signer, (await provider.getNetwork()).chainId, optionalParams);
};
