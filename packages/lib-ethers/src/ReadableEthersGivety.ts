import { BlockTag } from "@ethersproject/abstract-provider";

import {
  Decimal,
  Fees,
  FrontendStatus,
  GivetyStore,
  GVTYStake,
  ReadableGivety,
  StabilityDeposit,
  Trove,
  TroveListingParams,
  TroveWithPendingRedistribution,
  UserTrove,
  UserTroveStatus
} from "givety-lib-base";

import { MultiTroveGetter } from "../types";

import { decimalify, numberify, panic } from "./_utils";
import { EthersCallOverrides, EthersProvider, EthersSigner } from "./types";

import {
  EthersGivetyConnection,
  EthersGivetyConnectionOptionalParams,
  EthersGivetyStoreOption,
  _connect,
  _getBlockTimestamp,
  _getContracts,
  _requireAddress,
  _requireFrontendAddress
} from "./EthersGivetyConnection";

import { BlockPolledGivetyStore } from "./BlockPolledGivetyStore";

// TODO: these are constant in the contracts, so it doesn't make sense to make a call for them,
// but to avoid having to update them here when we change them in the contracts, we could read
// them once after deployment and save them to GivetyDeployment.
const MINUTE_DECAY_FACTOR = Decimal.from("0.999037758833783000");
const BETA = Decimal.from(2);

enum BackendTroveStatus {
  nonExistent,
  active,
  closedByOwner,
  closedByLiquidation,
  closedByRedemption
}

const userTroveStatusFrom = (backendStatus: BackendTroveStatus): UserTroveStatus =>
  backendStatus === BackendTroveStatus.nonExistent
    ? "nonExistent"
    : backendStatus === BackendTroveStatus.active
    ? "open"
    : backendStatus === BackendTroveStatus.closedByOwner
    ? "closedByOwner"
    : backendStatus === BackendTroveStatus.closedByLiquidation
    ? "closedByLiquidation"
    : backendStatus === BackendTroveStatus.closedByRedemption
    ? "closedByRedemption"
    : panic(new Error(`invalid backendStatus ${backendStatus}`));

const convertToDate = (timestamp: number) => new Date(timestamp * 1000);

const validSortingOptions = ["ascendingCollateralRatio", "descendingCollateralRatio"];

const expectPositiveInt = <K extends string>(obj: { [P in K]?: number }, key: K) => {
  if (obj[key] !== undefined) {
    if (!Number.isInteger(obj[key])) {
      throw new Error(`${key} must be an integer`);
    }

    if (obj[key] < 0) {
      throw new Error(`${key} must not be negative`);
    }
  }
};

/**
 * Ethers-based implementation of {@link givety-lib-base#ReadableGivety}.
 *
 * @public
 */
export class ReadableEthersGivety implements ReadableGivety {
  readonly connection: EthersGivetyConnection;

  /** @internal */
  constructor(connection: EthersGivetyConnection) {
    this.connection = connection;
  }

  /** @internal */
  static _from(
    connection: EthersGivetyConnection & { useStore: "blockPolled" }
  ): ReadableEthersGivetyWithStore<BlockPolledGivetyStore>;

  /** @internal */
  static _from(connection: EthersGivetyConnection): ReadableEthersGivety;

  /** @internal */
  static _from(connection: EthersGivetyConnection): ReadableEthersGivety {
    const readable = new ReadableEthersGivety(connection);

    return connection.useStore === "blockPolled"
      ? new _BlockPolledReadableEthersGivety(readable)
      : readable;
  }

  /** @internal */
  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams: EthersGivetyConnectionOptionalParams & { useStore: "blockPolled" }
  ): Promise<ReadableEthersGivetyWithStore<BlockPolledGivetyStore>>;

  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersGivetyConnectionOptionalParams
  ): Promise<ReadableEthersGivety>;

  /**
   * Connect to the Givety protocol and create a `ReadableEthersGivety` object.
   *
   * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
   *                           network.
   * @param optionalParams - Optional parameters that can be used to customize the connection.
   */
  static async connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersGivetyConnectionOptionalParams
  ): Promise<ReadableEthersGivety> {
    return ReadableEthersGivety._from(await _connect(signerOrProvider, optionalParams));
  }

  /**
   * Check whether this `ReadableEthersGivety` is a {@link ReadableEthersGivetyWithStore}.
   */
  hasStore(): this is ReadableEthersGivetyWithStore;

  /**
   * Check whether this `ReadableEthersGivety` is a
   * {@link ReadableEthersGivetyWithStore}\<{@link BlockPolledGivetyStore}\>.
   */
  hasStore(store: "blockPolled"): this is ReadableEthersGivetyWithStore<BlockPolledGivetyStore>;

  hasStore(): boolean {
    return false;
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalRedistributed} */
  async getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove> {
    const { troveManager } = _getContracts(this.connection);

    const [collateral, debt] = await Promise.all([
      troveManager.L_GIVE({ ...overrides }).then(decimalify),
      troveManager.L_GUSDDebt({ ...overrides }).then(decimalify)
    ]);

    return new Trove(collateral, debt);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTroveBeforeRedistribution} */
  async getTroveBeforeRedistribution(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    address ??= _requireAddress(this.connection);
    const { troveManager } = _getContracts(this.connection);

    const [trove, snapshot] = await Promise.all([
      troveManager.Troves(address, { ...overrides }),
      troveManager.rewardSnapshots(address, { ...overrides })
    ]);

    if (trove.status === BackendTroveStatus.active) {
      return new TroveWithPendingRedistribution(
        address,
        userTroveStatusFrom(trove.status),
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(decimalify(snapshot.GIVE), decimalify(snapshot.GUSDDebt))
      );
    } else {
      return new TroveWithPendingRedistribution(address, userTroveStatusFrom(trove.status));
    }
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTrove} */
  async getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove> {
    const [trove, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, overrides),
      this.getTotalRedistributed(overrides)
    ]);

    return trove.applyRedistribution(totalRedistributed);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getNumberOfTroves} */
  async getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number> {
    const { troveManager } = _getContracts(this.connection);

    return (await troveManager.getTroveOwnersCount({ ...overrides })).toNumber();
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getPrice} */
  getPrice(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { priceFeed } = _getContracts(this.connection);

    return priceFeed.callStatic.fetchPrice({ ...overrides }).then(decimalify);
  }

  /** @internal */
  async _getActivePool(overrides?: EthersCallOverrides): Promise<Trove> {
    const { activePool } = _getContracts(this.connection);

    const [activeCollateral, activeDebt] = await Promise.all(
      [
        activePool.getGIVE({ ...overrides }),
        activePool.getGUSDDebt({ ...overrides })
      ].map(getBigNumber => getBigNumber.then(decimalify))
    );

    return new Trove(activeCollateral, activeDebt);
  }

  /** @internal */
  async _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove> {
    const { defaultPool } = _getContracts(this.connection);

    const [liquidatedCollateral, closedDebt] = await Promise.all(
      [
        defaultPool.getGIVE({ ...overrides }),
        defaultPool.getGUSDDebt({ ...overrides })
      ].map(getBigNumber => getBigNumber.then(decimalify))
    );

    return new Trove(liquidatedCollateral, closedDebt);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotal} */
  async getTotal(overrides?: EthersCallOverrides): Promise<Trove> {
    const [activePool, defaultPool] = await Promise.all([
      this._getActivePool(overrides),
      this._getDefaultPool(overrides)
    ]);

    return activePool.add(defaultPool);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getStabilityDeposit} */
  async getStabilityDeposit(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<StabilityDeposit> {
    address ??= _requireAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const [
      { frontEndTag, initialValue },
      currentGUSD,
      collateralGain,
      gvtyReward
    ] = await Promise.all([
      stabilityPool.deposits(address, { ...overrides }),
      stabilityPool.getCompoundedGUSDDeposit(address, { ...overrides }),
      stabilityPool.getDepositorGIVEGain(address, { ...overrides }),
      stabilityPool.getDepositorGVTYGain(address, { ...overrides })
    ]);

    return new StabilityDeposit(
      decimalify(initialValue),
      decimalify(currentGUSD),
      decimalify(collateralGain),
      decimalify(gvtyReward),
      frontEndTag
    );
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getRemainingStabilityPoolGVTYReward} */
  async getRemainingStabilityPoolGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { communityIssuance } = _getContracts(this.connection);

    const issuanceCap = this.connection.totalStabilityPoolGVTYReward;
    const totalGVTYIssued = decimalify(await communityIssuance.totalGVTYIssued({ ...overrides }));

    // totalGVTYIssued approaches but never reaches issuanceCap
    return issuanceCap.sub(totalGVTYIssued);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGUSDInStabilityPool} */
  getGUSDInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { stabilityPool } = _getContracts(this.connection);

    return stabilityPool.getTotalGUSDDeposits({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGUSDBalance} */
  getGUSDBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { gusdToken } = _getContracts(this.connection);

    return gusdToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGVTYBalance} */
  getGVTYBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { gvtyToken } = _getContracts(this.connection);

    return gvtyToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGivTokenBalance} */
  getGivTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { givToken } = _getContracts(this.connection);

    return givToken.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGivTokenAllowance} */
  getGivTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { givToken, givpool } = _getContracts(this.connection);

    return givToken.allowance(address, givpool.address, { ...overrides }).then(decimalify);
  }

  /** @internal */
  async _getRemainingLiquidityMiningGVTYRewardCalculator(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number) => Decimal> {
    const { givpool } = _getContracts(this.connection);

    const [totalSupply, rewardRate, periodFinish, lastUpdateTime] = await Promise.all([
      givpool.totalSupply({ ...overrides }),
      givpool.rewardRate({ ...overrides }).then(decimalify),
      givpool.periodFinish({ ...overrides }).then(numberify),
      givpool.lastUpdateTime({ ...overrides }).then(numberify)
    ]);

    return (blockTimestamp: number) =>
      rewardRate.mul(
        Math.max(0, periodFinish - (totalSupply.isZero() ? lastUpdateTime : blockTimestamp))
      );
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getRemainingLiquidityMiningGVTYReward} */
  async getRemainingLiquidityMiningGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    const [calculateRemainingGVTY, blockTimestamp] = await Promise.all([
      this._getRemainingLiquidityMiningGVTYRewardCalculator(overrides),
      this._getBlockTimestamp(overrides?.blockTag)
    ]);

    return calculateRemainingGVTY(blockTimestamp);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getLiquidityMiningStake} */
  getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { givpool } = _getContracts(this.connection);

    return givpool.balanceOf(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalStakedGivTokens} */
  getTotalStakedGivTokens(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { givpool } = _getContracts(this.connection);

    return givpool.totalSupply({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getLiquidityMiningGVTYReward} */
  getLiquidityMiningGVTYReward(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { givpool } = _getContracts(this.connection);

    return givpool.earned(address, { ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getCollateralSurplusBalance} */
  getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    address ??= _requireAddress(this.connection);
    const { collSurplusPool } = _getContracts(this.connection);

    return collSurplusPool.getCollateral(address, { ...overrides }).then(decimalify);
  }

  /** @internal */
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution[]>;

  /** {@inheritDoc givety-lib-base#ReadableGivety.(getTroves:2)} */
  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;

  async getTroves(
    params: TroveListingParams,
    overrides?: EthersCallOverrides
  ): Promise<UserTrove[]> {
    const { multiTroveGetter } = _getContracts(this.connection);

    expectPositiveInt(params, "first");
    expectPositiveInt(params, "startingAt");

    if (!validSortingOptions.includes(params.sortedBy)) {
      throw new Error(
        `sortedBy must be one of: ${validSortingOptions.map(x => `"${x}"`).join(", ")}`
      );
    }

    const [totalRedistributed, backendTroves] = await Promise.all([
      params.beforeRedistribution ? undefined : this.getTotalRedistributed({ ...overrides }),
      multiTroveGetter.getMultipleSortedTroves(
        params.sortedBy === "descendingCollateralRatio"
          ? params.startingAt ?? 0
          : -((params.startingAt ?? 0) + 1),
        params.first,
        { ...overrides }
      )
    ]);

    const troves = mapBackendTroves(backendTroves);

    if (totalRedistributed) {
      return troves.map(trove => trove.applyRedistribution(totalRedistributed));
    } else {
      return troves;
    }
  }

  /** @internal */
  _getBlockTimestamp(blockTag?: BlockTag): Promise<number> {
    return _getBlockTimestamp(this.connection, blockTag);
  }

  /** @internal */
  async _getFeesFactory(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees> {
    const { troveManager } = _getContracts(this.connection);

    const [lastFeeOperationTime, baseRateWithoutDecay] = await Promise.all([
      troveManager.lastFeeOperationTime({ ...overrides }),
      troveManager.baseRate({ ...overrides }).then(decimalify)
    ]);

    return (blockTimestamp, recoveryMode) =>
      new Fees(
        baseRateWithoutDecay,
        MINUTE_DECAY_FACTOR,
        BETA,
        convertToDate(lastFeeOperationTime.toNumber()),
        convertToDate(blockTimestamp),
        recoveryMode
      );
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getFees} */
  async getFees(overrides?: EthersCallOverrides): Promise<Fees> {
    const [createFees, total, price, blockTimestamp] = await Promise.all([
      this._getFeesFactory(overrides),
      this.getTotal(overrides),
      this.getPrice(overrides),
      this._getBlockTimestamp(overrides?.blockTag)
    ]);

    return createFees(blockTimestamp, total.collateralRatioIsBelowCritical(price));
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGVTYStake} */
  async getGVTYStake(address?: string, overrides?: EthersCallOverrides): Promise<GVTYStake> {
    address ??= _requireAddress(this.connection);
    const { gvtyStaking } = _getContracts(this.connection);

    const [stakedGVTY, collateralGain, gusdGain] = await Promise.all(
      [
        gvtyStaking.stakes(address, { ...overrides }),
        gvtyStaking.getPendingGIVEGain(address, { ...overrides }),
        gvtyStaking.getPendingGUSDGain(address, { ...overrides })
      ].map(getBigNumber => getBigNumber.then(decimalify))
    );

    return new GVTYStake(stakedGVTY, collateralGain, gusdGain);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalStakedGVTY} */
  async getTotalStakedGVTY(overrides?: EthersCallOverrides): Promise<Decimal> {
    const { gvtyStaking } = _getContracts(this.connection);

    return gvtyStaking.totalGVTYStaked({ ...overrides }).then(decimalify);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getFrontendStatus} */
  async getFrontendStatus(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<FrontendStatus> {
    address ??= _requireFrontendAddress(this.connection);
    const { stabilityPool } = _getContracts(this.connection);

    const { registered, kickbackRate } = await stabilityPool.frontEnds(address, { ...overrides });

    return registered
      ? { status: "registered", kickbackRate: decimalify(kickbackRate) }
      : { status: "unregistered" };
  }
}

type Resolved<T> = T extends Promise<infer U> ? U : T;
type BackendTroves = Resolved<ReturnType<MultiTroveGetter["getMultipleSortedTroves"]>>;

const mapBackendTroves = (troves: BackendTroves): TroveWithPendingRedistribution[] =>
  troves.map(
    trove =>
      new TroveWithPendingRedistribution(
        trove.owner,
        "open", // These Troves are coming from the SortedTroves list, so they must be open
        decimalify(trove.coll),
        decimalify(trove.debt),
        decimalify(trove.stake),
        new Trove(decimalify(trove.snapshotGIVE), decimalify(trove.snapshotGUSDDebt))
      )
  );

/**
 * Variant of {@link ReadableEthersGivety} that exposes a {@link givety-lib-base#GivetyStore}.
 *
 * @public
 */
export interface ReadableEthersGivetyWithStore<T extends GivetyStore = GivetyStore>
  extends ReadableEthersGivety {
  /** An object that implements GivetyStore. */
  readonly store: T;
}

class _BlockPolledReadableEthersGivety
  implements ReadableEthersGivetyWithStore<BlockPolledGivetyStore> {
  readonly connection: EthersGivetyConnection;
  readonly store: BlockPolledGivetyStore;

  private readonly _readable: ReadableEthersGivety;

  constructor(readable: ReadableEthersGivety) {
    const store = new BlockPolledGivetyStore(readable);

    this.store = store;
    this.connection = readable.connection;
    this._readable = readable;
  }

  private _blockHit(overrides?: EthersCallOverrides): boolean {
    return (
      !overrides ||
      overrides.blockTag === undefined ||
      overrides.blockTag === this.store.state.blockTag
    );
  }

  private _userHit(address?: string, overrides?: EthersCallOverrides): boolean {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.userAddress)
    );
  }

  private _frontendHit(address?: string, overrides?: EthersCallOverrides): boolean {
    return (
      this._blockHit(overrides) &&
      (address === undefined || address === this.store.connection.frontendTag)
    );
  }

  hasStore(store?: EthersGivetyStoreOption): boolean {
    return store === undefined || store === "blockPolled";
  }

  async getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._blockHit(overrides)
      ? this.store.state.totalRedistributed
      : this._readable.getTotalRedistributed(overrides);
  }

  async getTroveBeforeRedistribution(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    return this._userHit(address, overrides)
      ? this.store.state.troveBeforeRedistribution
      : this._readable.getTroveBeforeRedistribution(address, overrides);
  }

  async getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove> {
    return this._userHit(address, overrides)
      ? this.store.state.trove
      : this._readable.getTrove(address, overrides);
  }

  async getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number> {
    return this._blockHit(overrides)
      ? this.store.state.numberOfTroves
      : this._readable.getNumberOfTroves(overrides);
  }

  async getPrice(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides) ? this.store.state.price : this._readable.getPrice(overrides);
  }

  async getTotal(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._blockHit(overrides) ? this.store.state.total : this._readable.getTotal(overrides);
  }

  async getStabilityDeposit(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<StabilityDeposit> {
    return this._userHit(address, overrides)
      ? this.store.state.stabilityDeposit
      : this._readable.getStabilityDeposit(address, overrides);
  }

  async getRemainingStabilityPoolGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.remainingStabilityPoolGVTYReward
      : this._readable.getRemainingStabilityPoolGVTYReward(overrides);
  }

  async getGUSDInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.gusdInStabilityPool
      : this._readable.getGUSDInStabilityPool(overrides);
  }

  async getGUSDBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.gusdBalance
      : this._readable.getGUSDBalance(address, overrides);
  }

  async getGVTYBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.gvtyBalance
      : this._readable.getGVTYBalance(address, overrides);
  }

  async getGivTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.givTokenBalance
      : this._readable.getGivTokenBalance(address, overrides);
  }

  async getGivTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.givTokenAllowance
      : this._readable.getGivTokenAllowance(address, overrides);
  }

  async getRemainingLiquidityMiningGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.remainingLiquidityMiningGVTYReward
      : this._readable.getRemainingLiquidityMiningGVTYReward(overrides);
  }

  async getLiquidityMiningStake(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningStake
      : this._readable.getLiquidityMiningStake(address, overrides);
  }

  async getTotalStakedGivTokens(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedGivTokens
      : this._readable.getTotalStakedGivTokens(overrides);
  }

  async getLiquidityMiningGVTYReward(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.liquidityMiningGVTYReward
      : this._readable.getLiquidityMiningGVTYReward(address, overrides);
  }

  async getCollateralSurplusBalance(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<Decimal> {
    return this._userHit(address, overrides)
      ? this.store.state.collateralSurplusBalance
      : this._readable.getCollateralSurplusBalance(address, overrides);
  }

  async _getBlockTimestamp(blockTag?: BlockTag): Promise<number> {
    return this._blockHit({ blockTag })
      ? this.store.state.blockTimestamp
      : this._readable._getBlockTimestamp(blockTag);
  }

  async _getFeesFactory(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees> {
    return this._blockHit(overrides)
      ? this.store.state._feesFactory
      : this._readable._getFeesFactory(overrides);
  }

  async getFees(overrides?: EthersCallOverrides): Promise<Fees> {
    return this._blockHit(overrides) ? this.store.state.fees : this._readable.getFees(overrides);
  }

  async getGVTYStake(address?: string, overrides?: EthersCallOverrides): Promise<GVTYStake> {
    return this._userHit(address, overrides)
      ? this.store.state.gvtyStake
      : this._readable.getGVTYStake(address, overrides);
  }

  async getTotalStakedGVTY(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._blockHit(overrides)
      ? this.store.state.totalStakedGVTY
      : this._readable.getTotalStakedGVTY(overrides);
  }

  async getFrontendStatus(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<FrontendStatus> {
    return this._frontendHit(address, overrides)
      ? this.store.state.frontend
      : this._readable.getFrontendStatus(address, overrides);
  }

  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;

  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]> {
    return this._readable.getTroves(params, overrides);
  }

  _getActivePool(): Promise<Trove> {
    throw new Error("Method not implemented.");
  }

  _getDefaultPool(): Promise<Trove> {
    throw new Error("Method not implemented.");
  }

  _getRemainingLiquidityMiningGVTYRewardCalculator(): Promise<(blockTimestamp: number) => Decimal> {
    throw new Error("Method not implemented.");
  }
}
