import { Decimal, Decimalish } from "./Decimal";
import { TroveAdjustmentParams, TroveCreationParams } from "./Trove";
import { GivetyReceipt, SendableGivety, SentGivetyTransaction } from "./SendableGivety";

import {
  CollateralGainTransferDetails,
  LiquidationDetails,
  RedemptionDetails,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TroveAdjustmentDetails,
  TroveClosureDetails,
  TroveCreationDetails
} from "./TransactableGivety";

/**
 * A transaction that has been prepared for sending.
 *
 * @remarks
 * Implemented by {@link @givety/lib-ethers#PopulatedEthersGivetyTransaction}.
 *
 * @public
 */
export interface PopulatedGivetyTransaction<
  P = unknown,
  T extends SentGivetyTransaction = SentGivetyTransaction
> {
  /** Implementation-specific populated transaction object. */
  readonly rawPopulatedTransaction: P;

  /**
   * Send the transaction.
   *
   * @returns An object that implements {@link givety-lib-base#SentGivetyTransaction}.
   */
  send(): Promise<T>;
}

/**
 * A redemption transaction that has been prepared for sending.
 *
 * @remarks
 * The Givety protocol fulfills redemptions by repaying the debt of Troves in ascending order of
 * their collateralization ratio, and taking a portion of their collateral in exchange. Due to the
 * {@link givety-lib-base#GUSD_MINIMUM_DEBT | minimum debt} requirement that Troves must fulfill,
 * some GUSD amounts are not possible to redeem exactly.
 *
 * When {@link givety-lib-base#PopulatableGivety.redeemGUSD | redeemGUSD()} is called with an
 * amount that can't be fully redeemed, the amount will be truncated (see the `redeemableGUSDAmount`
 * property). When this happens, the redeemer can either redeem the truncated amount by sending the
 * transaction unchanged, or prepare a new transaction by
 * {@link givety-lib-base#PopulatedRedemption.increaseAmountByMinimumNetDebt | increasing the amount}
 * to the next lowest possible value, which is the sum of the truncated amount and
 * {@link givety-lib-base#GUSD_MINIMUM_NET_DEBT}.
 *
 * @public
 */
export interface PopulatedRedemption<P = unknown, S = unknown, R = unknown>
  extends PopulatedGivetyTransaction<
    P,
    SentGivetyTransaction<S, GivetyReceipt<R, RedemptionDetails>>
  > {
  /** Amount of GUSD the redeemer is trying to redeem. */
  readonly attemptedGUSDAmount: Decimal;

  /** Maximum amount of GUSD that is currently redeemable from `attemptedGUSDAmount`. */
  readonly redeemableGUSDAmount: Decimal;

  /** Whether `redeemableGUSDAmount` is less than `attemptedGUSDAmount`. */
  readonly isTruncated: boolean;

  /**
   * Prepare a new transaction by increasing the attempted amount to the next lowest redeemable
   * value.
   *
   * @param maxRedemptionRate - Maximum acceptable
   *                            {@link givety-lib-base#Fees.redemptionRate | redemption rate} to
   *                            use in the new transaction.
   *
   * @remarks
   * If `maxRedemptionRate` is omitted, the original transaction's `maxRedemptionRate` is reused
   * unless that was also omitted, in which case the current redemption rate (based on the increased
   * amount) plus 0.1% is used as maximum acceptable rate.
   */
  increaseAmountByMinimumNetDebt(
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemption<P, S, R>>;
}

/** @internal */
export type _PopulatableFrom<T, P> = {
  [M in keyof T]: T[M] extends (...args: infer A) => Promise<infer U>
    ? U extends SentGivetyTransaction
      ? (...args: A) => Promise<PopulatedGivetyTransaction<P, U>>
      : never
    : never;
};

/**
 * Prepare Givety transactions for sending.
 *
 * @remarks
 * The functions return an object implementing {@link PopulatedGivetyTransaction}, which can be
 * used to send the transaction and get a {@link SentGivetyTransaction}.
 *
 * Implemented by {@link @givety/lib-ethers#PopulatableEthersGivety}.
 *
 * @public
 */
export interface PopulatableGivety<R = unknown, S = unknown, P = unknown>
  extends _PopulatableFrom<SendableGivety<R, S>, P> {
  // Methods re-declared for documentation purposes

  /** {@inheritDoc TransactableGivety.openTrove} */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveCreationDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.closeTrove} */
  closeTrove(): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, TroveClosureDetails>>>
  >;

  /** {@inheritDoc TransactableGivety.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.depositCollateral} */
  depositCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.borrowGUSD} */
  borrowGUSD(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.repayGUSD} */
  repayGUSD(
    amount: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>
    >
  >;

  /** @internal */
  setPrice(
    price: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.liquidate} */
  liquidate(
    address: string | string[]
  ): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, LiquidationDetails>>>
  >;

  /** {@inheritDoc TransactableGivety.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number
  ): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, LiquidationDetails>>>
  >;

  /** {@inheritDoc TransactableGivety.depositGUSDInStabilityPool} */
  depositGUSDInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.withdrawGUSDFromStabilityPool} */
  withdrawGUSDFromStabilityPool(
    amount: Decimalish
  ): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, StabilityDepositChangeDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, StabilityPoolGainsWithdrawalDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(): Promise<
    PopulatedGivetyTransaction<
      P,
      SentGivetyTransaction<S, GivetyReceipt<R, CollateralGainTransferDetails>>
    >
  >;

  /** {@inheritDoc TransactableGivety.sendGUSD} */
  sendGUSD(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.sendGVTY} */
  sendGVTY(
    toAddress: string,
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.redeemGUSD} */
  redeemGUSD(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish
  ): Promise<PopulatedRedemption<P, S, R>>;

  /** {@inheritDoc TransactableGivety.claimCollateralSurplus} */
  claimCollateralSurplus(): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableGivety.stakeGVTY} */
  stakeGVTY(
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.unstakeGVTY} */
  unstakeGVTY(
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableGivety.approveGivTokens} */
  approveGivTokens(
    allowance?: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.stakeGivTokens} */
  stakeGivTokens(
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.unstakeGivTokens} */
  unstakeGivTokens(
    amount: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;

  /** {@inheritDoc TransactableGivety.withdrawGVTYRewardFromLiquidityMining} */
  withdrawGVTYRewardFromLiquidityMining(): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableGivety.exitLiquidityMining} */
  exitLiquidityMining(): Promise<
    PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>
  >;

  /** {@inheritDoc TransactableGivety.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish
  ): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;
}
