import { Decimal, Decimalish } from "./Decimal";
import { Trove, TroveAdjustmentParams, TroveClosureParams, TroveCreationParams } from "./Trove";
import { StabilityDepositChange } from "./StabilityDeposit";
import { FailedReceipt } from "./SendableGivety";

/**
 * Thrown by {@link TransactableGivety} functions in case of transaction failure.
 *
 * @public
 */
export class TransactionFailedError<T extends FailedReceipt = FailedReceipt> extends Error {
  readonly failedReceipt: T;

  /** @internal */
  constructor(name: string, message: string, failedReceipt: T) {
    super(message);
    this.name = name;
    this.failedReceipt = failedReceipt;
  }
}

/**
 * Details of an {@link TransactableGivety.openTrove | openTrove()} transaction.
 *
 * @public
 */
export interface TroveCreationDetails {
  /** How much was deposited and borrowed. */
  params: TroveCreationParams<Decimal>;

  /** The Trove that was created by the transaction. */
  newTrove: Trove;

  /** Amount of GUSD added to the Trove's debt as borrowing fee. */
  fee: Decimal;
}

/**
 * Details of an {@link TransactableGivety.adjustTrove | adjustTrove()} transaction.
 *
 * @public
 */
export interface TroveAdjustmentDetails {
  /** Parameters of the adjustment. */
  params: TroveAdjustmentParams<Decimal>;

  /** New state of the adjusted Trove directly after the transaction. */
  newTrove: Trove;

  /** Amount of GUSD added to the Trove's debt as borrowing fee. */
  fee: Decimal;
}

/**
 * Details of a {@link TransactableGivety.closeTrove | closeTrove()} transaction.
 *
 * @public
 */
export interface TroveClosureDetails {
  /** How much was withdrawn and repaid. */
  params: TroveClosureParams<Decimal>;
}

/**
 * Details of a {@link TransactableGivety.liquidate | liquidate()} or
 * {@link TransactableGivety.liquidateUpTo | liquidateUpTo()} transaction.
 *
 * @public
 */
export interface LiquidationDetails {
  /** Addresses whose Troves were liquidated by the transaction. */
  liquidatedAddresses: string[];

  /** Total collateral liquidated and debt cleared by the transaction. */
  totalLiquidated: Trove;

  /** Amount of GUSD paid to the liquidator as gas compensation. */
  gusdGasCompensation: Decimal;

  /** Amount of native currency (e.g. Give) paid to the liquidator as gas compensation. */
  collateralGasCompensation: Decimal;
}

/**
 * Details of a {@link TransactableGivety.redeemGUSD | redeemGUSD()} transaction.
 *
 * @public
 */
export interface RedemptionDetails {
  /** Amount of GUSD the redeemer tried to redeem. */
  attemptedGUSDAmount: Decimal;

  /**
   * Amount of GUSD that was actually redeemed by the transaction.
   *
   * @remarks
   * This can end up being lower than `attemptedGUSDAmount` due to interference from another
   * transaction that modifies the list of Troves.
   *
   * @public
   */
  actualGUSDAmount: Decimal;

  /** Amount of collateral (e.g. Give) taken from Troves by the transaction. */
  collateralTaken: Decimal;

  /** Amount of native currency (e.g. Give) deducted as fee from collateral taken. */
  fee: Decimal;
}

/**
 * Details of a
 * {@link TransactableGivety.withdrawGainsFromStabilityPool | withdrawGainsFromStabilityPool()}
 * transaction.
 *
 * @public
 */
export interface StabilityPoolGainsWithdrawalDetails {
  /** Amount of GUSD burned from the deposit by liquidations since the last modification. */
  gusdLoss: Decimal;

  /** Amount of GUSD in the deposit directly after this transaction. */
  newGUSDDeposit: Decimal;

  /** Amount of native currency (e.g. Give) paid out to the depositor in this transaction. */
  collateralGain: Decimal;

  /** Amount of GVTY rewarded to the depositor in this transaction. */
  gvtyReward: Decimal;
}

/**
 * Details of a
 * {@link TransactableGivety.depositGUSDInStabilityPool | depositGUSDInStabilityPool()} or
 * {@link TransactableGivety.withdrawGUSDFromStabilityPool | withdrawGUSDFromStabilityPool()}
 * transaction.
 *
 * @public
 */
export interface StabilityDepositChangeDetails extends StabilityPoolGainsWithdrawalDetails {
  /** Change that was made to the deposit by this transaction. */
  change: StabilityDepositChange<Decimal>;
}

/**
 * Details of a
 * {@link TransactableGivety.transferCollateralGainToTrove | transferCollateralGainToTrove()}
 * transaction.
 *
 * @public
 */
export interface CollateralGainTransferDetails extends StabilityPoolGainsWithdrawalDetails {
  /** New state of the depositor's Trove directly after the transaction. */
  newTrove: Trove;
}

/**
 * Send Givety transactions and wait for them to succeed.
 *
 * @remarks
 * The functions return the details of the transaction (if any), or throw an implementation-specific
 * subclass of {@link TransactionFailedError} in case of transaction failure.
 *
 * Implemented by {@link @givety/lib-ethers#EthersGivety}.
 *
 * @public
 */
export interface TransactableGivety {
  /**
   * Open a new Trove by depositing collateral and borrowing GUSD.
   *
   * @param params - How much to deposit and borrow.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link givety-lib-base#Fees.borrowingRate | borrowing rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * If `maxBorrowingRate` is omitted, the current borrowing rate plus 0.5% is used as maximum
   * acceptable rate.
   */
  openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<TroveCreationDetails>;

  /**
   * Close existing Trove by repaying all debt and withdrawing all collateral.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  closeTrove(): Promise<TroveClosureDetails>;

  /**
   * Adjust existing Trove by changing its collateral, debt, or both.
   *
   * @param params - Parameters of the adjustment.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link givety-lib-base#Fees.borrowingRate | borrowing rate} if
   *                           `params` includes `borrowGUSD`.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The transaction will fail if the Trove's debt would fall below
   * {@link givety-lib-base#GUSD_MINIMUM_DEBT}.
   *
   * If `maxBorrowingRate` is omitted, the current borrowing rate plus 0.5% is used as maximum
   * acceptable rate.
   */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRate?: Decimalish
  ): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by depositing more collateral.
   *
   * @param amount - The amount of collateral to add to the Trove's existing collateral.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ depositCollateral: amount })
   * ```
   */
  depositCollateral(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by withdrawing some of its collateral.
   *
   * @param amount - The amount of collateral to withdraw from the Trove.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ withdrawCollateral: amount })
   * ```
   */
  withdrawCollateral(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by borrowing more GUSD.
   *
   * @param amount - The amount of GUSD to borrow.
   * @param maxBorrowingRate - Maximum acceptable
   *                           {@link givety-lib-base#Fees.borrowingRate | borrowing rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ borrowGUSD: amount }, maxBorrowingRate)
   * ```
   */
  borrowGUSD(amount: Decimalish, maxBorrowingRate?: Decimalish): Promise<TroveAdjustmentDetails>;

  /**
   * Adjust existing Trove by repaying some of its debt.
   *
   * @param amount - The amount of GUSD to repay.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * Equivalent to:
   *
   * ```typescript
   * adjustTrove({ repayGUSD: amount })
   * ```
   */
  repayGUSD(amount: Decimalish): Promise<TroveAdjustmentDetails>;

  /** @internal */
  setPrice(price: Decimalish): Promise<void>;

  /**
   * Liquidate one or more undercollateralized Troves.
   *
   * @param address - Address or array of addresses whose Troves to liquidate.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  liquidate(address: string | string[]): Promise<LiquidationDetails>;

  /**
   * Liquidate the least collateralized Troves up to a maximum number.
   *
   * @param maximumNumberOfTrovesToLiquidate - Stop after liquidating this many Troves.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  liquidateUpTo(maximumNumberOfTrovesToLiquidate: number): Promise<LiquidationDetails>;

  /**
   * Make a new Stability Deposit, or top up existing one.
   *
   * @param amount - Amount of GUSD to add to new or existing deposit.
   * @param frontendTag - Address that should receive a share of this deposit's GVTY rewards.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The `frontendTag` parameter is only effective when making a new deposit.
   *
   * As a side-effect, the transaction will also pay out an existing Stability Deposit's
   * {@link givety-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link givety-lib-base#StabilityDeposit.gvtyReward | GVTY reward}.
   */
  depositGUSDInStabilityPool(
    amount: Decimalish,
    frontendTag?: string
  ): Promise<StabilityDepositChangeDetails>;

  /**
   * Withdraw GUSD from Stability Deposit.
   *
   * @param amount - Amount of GUSD to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out the Stability Deposit's
   * {@link givety-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link givety-lib-base#StabilityDeposit.gvtyReward | GVTY reward}.
   */
  withdrawGUSDFromStabilityPool(amount: Decimalish): Promise<StabilityDepositChangeDetails>;

  /**
   * Withdraw {@link givety-lib-base#StabilityDeposit.collateralGain | collateral gain} and
   * {@link givety-lib-base#StabilityDeposit.gvtyReward | GVTY reward} from Stability Deposit.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawGainsFromStabilityPool(): Promise<StabilityPoolGainsWithdrawalDetails>;

  /**
   * Transfer {@link givety-lib-base#StabilityDeposit.collateralGain | collateral gain} from
   * Stability Deposit to Trove.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * The collateral gain is transfered to the Trove as additional collateral.
   *
   * As a side-effect, the transaction will also pay out the Stability Deposit's
   * {@link givety-lib-base#StabilityDeposit.gvtyReward | GVTY reward}.
   */
  transferCollateralGainToTrove(): Promise<CollateralGainTransferDetails>;

  /**
   * Send GUSD tokens to an address.
   *
   * @param toAddress - Address of receipient.
   * @param amount - Amount of GUSD to send.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  sendGUSD(toAddress: string, amount: Decimalish): Promise<void>;

  /**
   * Send GVTY tokens to an address.
   *
   * @param toAddress - Address of receipient.
   * @param amount - Amount of GVTY to send.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  sendGVTY(toAddress: string, amount: Decimalish): Promise<void>;

  /**
   * Redeem GUSD to native currency (e.g. Give) at face value.
   *
   * @param amount - Amount of GUSD to be redeemed.
   * @param maxRedemptionRate - Maximum acceptable
   *                            {@link givety-lib-base#Fees.redemptionRate | redemption rate}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * If `maxRedemptionRate` is omitted, the current redemption rate (based on `amount`) plus 0.1%
   * is used as maximum acceptable rate.
   */
  redeemGUSD(amount: Decimalish, maxRedemptionRate?: Decimalish): Promise<RedemptionDetails>;

  /**
   * Claim leftover collateral after a liquidation or redemption.
   *
   * @remarks
   * Use {@link givety-lib-base#ReadableGivety.getCollateralSurplusBalance | getCollateralSurplusBalance()}
   * to check the amount of collateral available for withdrawal.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  claimCollateralSurplus(): Promise<void>;

  /**
   * Stake GVTY to start earning fee revenue or increase existing stake.
   *
   * @param amount - Amount of GVTY to add to new or existing stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out an existing GVTY stake's
   * {@link givety-lib-base#GVTYStake.collateralGain | collateral gain} and
   * {@link givety-lib-base#GVTYStake.gusdGain | GUSD gain}.
   */
  stakeGVTY(amount: Decimalish): Promise<void>;

  /**
   * Withdraw GVTY from staking.
   *
   * @param amount - Amount of GVTY to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   *
   * @remarks
   * As a side-effect, the transaction will also pay out the GVTY stake's
   * {@link givety-lib-base#GVTYStake.collateralGain | collateral gain} and
   * {@link givety-lib-base#GVTYStake.gusdGain | GUSD gain}.
   */
  unstakeGVTY(amount: Decimalish): Promise<void>;

  /**
   * Withdraw {@link givety-lib-base#GVTYStake.collateralGain | collateral gain} and
   * {@link givety-lib-base#GVTYStake.gusdGain | GUSD gain} from GVTY stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawGainsFromStaking(): Promise<void>;

  /**
   * Allow the liquidity mining contract to use GiveSwap GIVE/GUSD LP tokens for
   * {@link givety-lib-base#TransactableGivety.stakeGivTokens | staking}.
   *
   * @param allowance - Maximum amount of LP tokens that will be transferrable to liquidity mining
   *                    (`2^256 - 1` by default).
   *
   * @remarks
   * Must be performed before calling
   * {@link givety-lib-base#TransactableGivety.stakeGivTokens | stakeGivTokens()}.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  approveGivTokens(allowance?: Decimalish): Promise<void>;

  /**
   * Stake GiveSwap GIVE/GUSD LP tokens to participate in liquidity mining and earn GVTY.
   *
   * @param amount - Amount of LP tokens to add to new or existing stake.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  stakeGivTokens(amount: Decimalish): Promise<void>;

  /**
   * Withdraw GiveSwap GIVE/GUSD LP tokens from liquidity mining.
   *
   * @param amount - Amount of LP tokens to withdraw.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  unstakeGivTokens(amount: Decimalish): Promise<void>;

  /**
   * Withdraw GVTY that has been earned by mining liquidity.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  withdrawGVTYRewardFromLiquidityMining(): Promise<void>;

  /**
   * Withdraw all staked LP tokens from liquidity mining and claim reward.
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  exitLiquidityMining(): Promise<void>;

  /**
   * Register current wallet address as a Givety frontend.
   *
   * @param kickbackRate - The portion of GVTY rewards to pass onto users of the frontend
   *                       (between 0 and 1).
   *
   * @throws
   * Throws {@link TransactionFailedError} in case of transaction failure.
   */
  registerFrontend(kickbackRate: Decimalish): Promise<void>;
}
