import { BlockTag } from "@ethersproject/abstract-provider";

import {
  CollateralGainTransferDetails,
  Decimal,
  Decimalish,
  FailedReceipt,
  Fees,
  FrontendStatus,
  LiquidationDetails,
  GivetyStore,
  GVTYStake,
  RedemptionDetails,
  StabilityDeposit,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TransactableGivety,
  TransactionFailedError,
  Trove,
  TroveAdjustmentDetails,
  TroveAdjustmentParams,
  TroveClosureDetails,
  TroveCreationDetails,
  TroveCreationParams,
  TroveListingParams,
  TroveWithPendingRedistribution,
  UserTrove
} from "givety-lib-base";

import {
  EthersGivetyConnection,
  EthersGivetyConnectionOptionalParams,
  EthersGivetyStoreOption,
  _connect,
  _usingStore
} from "./EthersGivetyConnection";

import {
  EthersCallOverrides,
  EthersProvider,
  EthersSigner,
  EthersTransactionOverrides,
  EthersTransactionReceipt
} from "./types";

import {
  BorrowingOperationOptionalParams,
  PopulatableEthersGivety,
  SentEthersGivetyTransaction
} from "./PopulatableEthersGivety";
import { ReadableEthersGivety, ReadableEthersGivetyWithStore } from "./ReadableEthersGivety";
import { SendableEthersGivety } from "./SendableEthersGivety";
import { BlockPolledGivetyStore } from "./BlockPolledGivetyStore";

/**
 * Thrown by {@link EthersGivety} in case of transaction failure.
 *
 * @public
 */
export class EthersTransactionFailedError extends TransactionFailedError<
  FailedReceipt<EthersTransactionReceipt>
> {
  constructor(message: string, failedReceipt: FailedReceipt<EthersTransactionReceipt>) {
    super("EthersTransactionFailedError", message, failedReceipt);
  }
}

const waitForSuccess = async <T>(tx: SentEthersGivetyTransaction<T>) => {
  const receipt = await tx.waitForReceipt();

  if (receipt.status !== "succeeded") {
    throw new EthersTransactionFailedError("Transaction failed", receipt);
  }

  return receipt.details;
};

/**
 * Convenience class that combines multiple interfaces of the library in one object.
 *
 * @public
 */
export class EthersGivety implements ReadableEthersGivety, TransactableGivety {
  /** Information about the connection to the Givety protocol. */
  readonly connection: EthersGivetyConnection;

  /** Can be used to create populated (unsigned) transactions. */
  readonly populate: PopulatableEthersGivety;

  /** Can be used to send transactions without waiting for them to be mined. */
  readonly send: SendableEthersGivety;

  private _readable: ReadableEthersGivety;

  /** @internal */
  constructor(readable: ReadableEthersGivety) {
    this._readable = readable;
    this.connection = readable.connection;
    this.populate = new PopulatableEthersGivety(readable);
    this.send = new SendableEthersGivety(this.populate);
  }

  /** @internal */
  static _from(
    connection: EthersGivetyConnection & { useStore: "blockPolled" }
  ): EthersGivetyWithStore<BlockPolledGivetyStore>;

  /** @internal */
  static _from(connection: EthersGivetyConnection): EthersGivety;

  /** @internal */
  static _from(connection: EthersGivetyConnection): EthersGivety {
    if (_usingStore(connection)) {
      return new _EthersGivetyWithStore(ReadableEthersGivety._from(connection));
    } else {
      return new EthersGivety(ReadableEthersGivety._from(connection));
    }
  }

  /** @internal */
  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams: EthersGivetyConnectionOptionalParams & { useStore: "blockPolled" }
  ): Promise<EthersGivetyWithStore<BlockPolledGivetyStore>>;

  /**
   * Connect to the Givety protocol and create an `EthersGivety` object.
   *
   * @param signerOrProvider - Ethers `Signer` or `Provider` to use for connecting to the Ethereum
   *                           network.
   * @param optionalParams - Optional parameters that can be used to customize the connection.
   */
  static connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersGivetyConnectionOptionalParams
  ): Promise<EthersGivety>;

  static async connect(
    signerOrProvider: EthersSigner | EthersProvider,
    optionalParams?: EthersGivetyConnectionOptionalParams
  ): Promise<EthersGivety> {
    return EthersGivety._from(await _connect(signerOrProvider, optionalParams));
  }

  /**
   * Check whether this `EthersGivety` is an {@link EthersGivetyWithStore}.
   */
  hasStore(): this is EthersGivetyWithStore;

  /**
   * Check whether this `EthersGivety` is an
   * {@link EthersGivetyWithStore}\<{@link BlockPolledGivetyStore}\>.
   */
  hasStore(store: "blockPolled"): this is EthersGivetyWithStore<BlockPolledGivetyStore>;

  hasStore(): boolean {
    return false;
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalRedistributed} */
  getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._readable.getTotalRedistributed(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTroveBeforeRedistribution} */
  getTroveBeforeRedistribution(
    address?: string,
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    return this._readable.getTroveBeforeRedistribution(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTrove} */
  getTrove(address?: string, overrides?: EthersCallOverrides): Promise<UserTrove> {
    return this._readable.getTrove(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getNumberOfTroves} */
  getNumberOfTroves(overrides?: EthersCallOverrides): Promise<number> {
    return this._readable.getNumberOfTroves(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getPrice} */
  getPrice(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getPrice(overrides);
  }

  /** @internal */
  _getActivePool(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._readable._getActivePool(overrides);
  }

  /** @internal */
  _getDefaultPool(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._readable._getDefaultPool(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotal} */
  getTotal(overrides?: EthersCallOverrides): Promise<Trove> {
    return this._readable.getTotal(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getStabilityDeposit} */
  getStabilityDeposit(address?: string, overrides?: EthersCallOverrides): Promise<StabilityDeposit> {
    return this._readable.getStabilityDeposit(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getRemainingStabilityPoolGVTYReward} */
  getRemainingStabilityPoolGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getRemainingStabilityPoolGVTYReward(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGUSDInStabilityPool} */
  getGUSDInStabilityPool(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getGUSDInStabilityPool(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGUSDBalance} */
  getGUSDBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getGUSDBalance(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGVTYBalance} */
  getGVTYBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getGVTYBalance(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGivTokenBalance} */
  getGivTokenBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getGivTokenBalance(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGivTokenAllowance} */
  getGivTokenAllowance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getGivTokenAllowance(address, overrides);
  }

  /** @internal */
  _getRemainingLiquidityMiningGVTYRewardCalculator(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number) => Decimal> {
    return this._readable._getRemainingLiquidityMiningGVTYRewardCalculator(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getRemainingLiquidityMiningGVTYReward} */
  getRemainingLiquidityMiningGVTYReward(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getRemainingLiquidityMiningGVTYReward(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getLiquidityMiningStake} */
  getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getLiquidityMiningStake(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalStakedGivTokens} */
  getTotalStakedGivTokens(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getTotalStakedGivTokens(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getLiquidityMiningGVTYReward} */
  getLiquidityMiningGVTYReward(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getLiquidityMiningGVTYReward(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getCollateralSurplusBalance} */
  getCollateralSurplusBalance(address?: string, overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getCollateralSurplusBalance(address, overrides);
  }

  /** @internal */
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution[]>;

  /** {@inheritDoc givety-lib-base#ReadableGivety.(getTroves:2)} */
  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]>;

  getTroves(params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]> {
    return this._readable.getTroves(params, overrides);
  }

  /** @internal */
  _getBlockTimestamp(blockTag?: BlockTag): Promise<number> {
    return this._readable._getBlockTimestamp(blockTag);
  }

  /** @internal */
  _getFeesFactory(
    overrides?: EthersCallOverrides
  ): Promise<(blockTimestamp: number, recoveryMode: boolean) => Fees> {
    return this._readable._getFeesFactory(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getFees} */
  getFees(overrides?: EthersCallOverrides): Promise<Fees> {
    return this._readable.getFees(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getGVTYStake} */
  getGVTYStake(address?: string, overrides?: EthersCallOverrides): Promise<GVTYStake> {
    return this._readable.getGVTYStake(address, overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getTotalStakedGVTY} */
  getTotalStakedGVTY(overrides?: EthersCallOverrides): Promise<Decimal> {
    return this._readable.getTotalStakedGVTY(overrides);
  }

  /** {@inheritDoc givety-lib-base#ReadableGivety.getFrontendStatus} */
  getFrontendStatus(address?: string, overrides?: EthersCallOverrides): Promise<FrontendStatus> {
    return this._readable.getFrontendStatus(address, overrides);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.openTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveCreationDetails> {
    return this.send
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.closeTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  closeTrove(overrides?: EthersTransactionOverrides): Promise<TroveClosureDetails> {
    return this.send.closeTrove(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.adjustTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveAdjustmentDetails> {
    return this.send
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.depositCollateral}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  depositCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveAdjustmentDetails> {
    return this.send.depositCollateral(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.withdrawCollateral}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveAdjustmentDetails> {
    return this.send.withdrawCollateral(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.borrowGUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  borrowGUSD(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveAdjustmentDetails> {
    return this.send.borrowGUSD(amount, maxBorrowingRate, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.repayGUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  repayGUSD(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<TroveAdjustmentDetails> {
    return this.send.repayGUSD(amount, overrides).then(waitForSuccess);
  }

  /** @internal */
  setPrice(price: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.setPrice(price, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.liquidate}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  liquidate(
    address: string | string[],
    overrides?: EthersTransactionOverrides
  ): Promise<LiquidationDetails> {
    return this.send.liquidate(address, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.liquidateUpTo}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number,
    overrides?: EthersTransactionOverrides
  ): Promise<LiquidationDetails> {
    return this.send.liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.depositGUSDInStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  depositGUSDInStabilityPool(
    amount: Decimalish,
    frontendTag?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<StabilityDepositChangeDetails> {
    return this.send.depositGUSDInStabilityPool(amount, frontendTag, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.withdrawGUSDFromStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGUSDFromStabilityPool(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<StabilityDepositChangeDetails> {
    return this.send.withdrawGUSDFromStabilityPool(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.withdrawGainsFromStabilityPool}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGainsFromStabilityPool(
    overrides?: EthersTransactionOverrides
  ): Promise<StabilityPoolGainsWithdrawalDetails> {
    return this.send.withdrawGainsFromStabilityPool(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.transferCollateralGainToTrove}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  transferCollateralGainToTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<CollateralGainTransferDetails> {
    return this.send.transferCollateralGainToTrove(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.sendGUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  sendGUSD(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<void> {
    return this.send.sendGUSD(toAddress, amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.sendGVTY}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  sendGVTY(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<void> {
    return this.send.sendGVTY(toAddress, amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.redeemGUSD}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  redeemGUSD(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<RedemptionDetails> {
    return this.send.redeemGUSD(amount, maxRedemptionRate, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.claimCollateralSurplus}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  claimCollateralSurplus(overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.claimCollateralSurplus(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.stakeGVTY}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  stakeGVTY(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.stakeGVTY(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.unstakeGVTY}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  unstakeGVTY(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.unstakeGVTY(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.withdrawGainsFromStaking}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.withdrawGainsFromStaking(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.registerFrontend}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.registerFrontend(kickbackRate, overrides).then(waitForSuccess);
  }

  /** @internal */
  _mintGivToken(
    amount: Decimalish,
    address?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<void> {
    return this.send._mintGivToken(amount, address, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.approveGivTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  approveGivTokens(allowance?: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.approveGivTokens(allowance, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.stakeGivTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  stakeGivTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.stakeGivTokens(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.unstakeGivTokens}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  unstakeGivTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.unstakeGivTokens(amount, overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.withdrawGVTYRewardFromLiquidityMining}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  withdrawGVTYRewardFromLiquidityMining(overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.withdrawGVTYRewardFromLiquidityMining(overrides).then(waitForSuccess);
  }

  /**
   * {@inheritDoc givety-lib-base#TransactableGivety.exitLiquidityMining}
   *
   * @throws
   * Throws {@link EthersTransactionFailedError} in case of transaction failure.
   * Throws {@link EthersTransactionCancelledError} if the transaction is cancelled or replaced.
   */
  exitLiquidityMining(overrides?: EthersTransactionOverrides): Promise<void> {
    return this.send.exitLiquidityMining(overrides).then(waitForSuccess);
  }
}

/**
 * Variant of {@link EthersGivety} that exposes a {@link givety-lib-base#GivetyStore}.
 *
 * @public
 */
export interface EthersGivetyWithStore<T extends GivetyStore = GivetyStore>
  extends EthersGivety {
  /** An object that implements GivetyStore. */
  readonly store: T;
}

class _EthersGivetyWithStore<T extends GivetyStore = GivetyStore>
  extends EthersGivety
  implements EthersGivetyWithStore<T> {
  readonly store: T;

  constructor(readable: ReadableEthersGivetyWithStore<T>) {
    super(readable);

    this.store = readable.store;
  }

  hasStore(store?: EthersGivetyStoreOption): boolean {
    return store === undefined || store === this.connection.useStore;
  }
}
