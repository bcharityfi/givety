import { Decimalish } from "./Decimal";
import { TroveAdjustmentParams, TroveCreationParams } from "./Trove";

import {
  CollateralGainTransferDetails,
  LiquidationDetails,
  RedemptionDetails,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TransactableGivety,
  TroveAdjustmentDetails,
  TroveClosureDetails,
  TroveCreationDetails
} from "./TransactableGivety";

/**
 * A transaction that has already been sent.
 *
 * @remarks
 * Implemented by {@link @givety/lib-ethers#SentEthersGivetyTransaction}.
 *
 * @public
 */
export interface SentGivetyTransaction<S = unknown, T extends GivetyReceipt = GivetyReceipt> {
  /** Implementation-specific sent transaction object. */
  readonly rawSentTransaction: S;

  /**
   * Check whether the transaction has been mined, and whether it was successful.
   *
   * @remarks
   * Unlike {@link givety-lib-base#SentGivetyTransaction.waitForReceipt | waitForReceipt()},
   * this function doesn't wait for the transaction to be mined.
   */
  getReceipt(): Promise<T>;

  /**
   * Wait for the transaction to be mined, and check whether it was successful.
   *
   * @returns Either a {@link givety-lib-base#FailedReceipt} or a
   *          {@link givety-lib-base#SuccessfulReceipt}.
   */
  waitForReceipt(): Promise<Extract<T, MinedReceipt>>;
}

/**
 * Indicates that the transaction hasn't been mined yet.
 *
 * @remarks
 * Returned by {@link SentGivetyTransaction.getReceipt}.
 *
 * @public
 */
export type PendingReceipt = { status: "pending" };

/** @internal */
export const _pendingReceipt: PendingReceipt = { status: "pending" };

/**
 * Indicates that the transaction has been mined, but it failed.
 *
 * @remarks
 * The `rawReceipt` property is an implementation-specific transaction receipt object.
 *
 * Returned by {@link SentGivetyTransaction.getReceipt} and
 * {@link SentGivetyTransaction.waitForReceipt}.
 *
 * @public
 */
export type FailedReceipt<R = unknown> = { status: "failed"; rawReceipt: R };

/** @internal */
export const _failedReceipt = <R>(rawReceipt: R): FailedReceipt<R> => ({
  status: "failed",
  rawReceipt
});

/**
 * Indicates that the transaction has succeeded.
 *
 * @remarks
 * The `rawReceipt` property is an implementation-specific transaction receipt object.
 *
 * The `details` property may contain more information about the transaction.
 * See the return types of {@link TransactableGivety} functions for the exact contents of `details`
 * for each type of Givety transaction.
 *
 * Returned by {@link SentGivetyTransaction.getReceipt} and
 * {@link SentGivetyTransaction.waitForReceipt}.
 *
 * @public
 */
export type SuccessfulReceipt<R = unknown, D = unknown> = {
  status: "succeeded";
  rawReceipt: R;
  details: D;
};

/** @internal */
export const _successfulReceipt = <R, D>(
  rawReceipt: R,
  details: D,
  toString?: () => string
): SuccessfulReceipt<R, D> => ({
  status: "succeeded",
  rawReceipt,
  details,
  ...(toString ? { toString } : {})
});

/**
 * Either a {@link FailedReceipt} or a {@link SuccessfulReceipt}.
 *
 * @public
 */
export type MinedReceipt<R = unknown, D = unknown> = FailedReceipt<R> | SuccessfulReceipt<R, D>;

/**
 * One of either a {@link PendingReceipt}, a {@link FailedReceipt} or a {@link SuccessfulReceipt}.
 *
 * @public
 */
export type GivetyReceipt<R = unknown, D = unknown> = PendingReceipt | MinedReceipt<R, D>;

/** @internal */
export type _SendableFrom<T, R, S> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer D>
    ? (...args: A) => Promise<SentGivetyTransaction<S, GivetyReceipt<R, D>>>
    : never;
};

/**
 * Send Givety transactions.
 *
 * @remarks
 * The functions return an object implementing {@link SentGivetyTransaction}, which can be used
 * to monitor the transaction and get its details when it succeeds.
 *
 * Implemented by {@link @givety/lib-ethers#SendableEthersGivety}.
 *
 * @public
 */
export interface SendableGivety<R = unknown, S = unknown>
  extends _SendableFrom<TransactableGivety, R, S> {
  // Methods re-declared for documentation purposes

  /** {@inheritDoc TransactableGivety.openTrove} */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveCreationDetails>>>;

  /** {@inheritDoc TransactableGivety.closeTrove} */
  closeTrove(): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveClosureDetails>>>;

  /** {@inheritDoc TransactableGivety.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableGivety.depositCollateral} */
  depositCollateral(
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableGivety.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableGivety.borrowGUSD} */
  borrowGUSD(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>;

  /** {@inheritDoc TransactableGivety.repayGUSD} */
  repayGUSD(
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>;

  /** @internal */
  setPrice(price: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.liquidate} */
  liquidate(
    address: string | string[]
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, LiquidationDetails>>>;

  /** {@inheritDoc TransactableGivety.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, LiquidationDetails>>>;

  /** {@inheritDoc TransactableGivety.depositGUSDInStabilityPool} */
  depositGUSDInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, StabilityDepositChangeDetails>>>;

  /** {@inheritDoc TransactableGivety.withdrawGUSDFromStabilityPool} */
  withdrawGUSDFromStabilityPool(
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, StabilityDepositChangeDetails>>>;

  /** {@inheritDoc TransactableGivety.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(): Promise<
    SentGivetyTransaction<S, GivetyReceipt<R, StabilityPoolGainsWithdrawalDetails>>
  >;

  /** {@inheritDoc TransactableGivety.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(): Promise<
    SentGivetyTransaction<S, GivetyReceipt<R, CollateralGainTransferDetails>>
  >;

  /** {@inheritDoc TransactableGivety.sendGUSD} */
  sendGUSD(
    toAddress: string,
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.sendGVTY} */
  sendGVTY(
    toAddress: string,
    amount: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.redeemGUSD} */
  redeemGUSD(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, RedemptionDetails>>>;

  /** {@inheritDoc TransactableGivety.claimCollateralSurplus} */
  claimCollateralSurplus(): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.stakeGVTY} */
  stakeGVTY(amount: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.unstakeGVTY} */
  unstakeGVTY(amount: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.approveGivTokens} */
  approveGivTokens(
    allowance?: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.stakeGivTokens} */
  stakeGivTokens(amount: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.unstakeGivTokens} */
  unstakeGivTokens(amount: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.withdrawGVTYRewardFromLiquidityMining} */
  withdrawGVTYRewardFromLiquidityMining(): Promise<
    SentGivetyTransaction<S, GivetyReceipt<R, void>>
  >;

  /** {@inheritDoc TransactableGivety.exitLiquidityMining} */
  exitLiquidityMining(): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;

  /** {@inheritDoc TransactableGivety.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish
  ): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;
}
