import {
  CollateralGainTransferDetails,
  Decimalish,
  LiquidationDetails,
  RedemptionDetails,
  SendableGivety,
  StabilityDepositChangeDetails,
  StabilityPoolGainsWithdrawalDetails,
  TroveAdjustmentDetails,
  TroveAdjustmentParams,
  TroveClosureDetails,
  TroveCreationDetails,
  TroveCreationParams
} from "givety-lib-base";

import {
  EthersTransactionOverrides,
  EthersTransactionReceipt,
  EthersTransactionResponse
} from "./types";

import {
  BorrowingOperationOptionalParams,
  PopulatableEthersGivety,
  PopulatedEthersGivetyTransaction,
  SentEthersGivetyTransaction
} from "./PopulatableEthersGivety";

const sendTransaction = <T>(tx: PopulatedEthersGivetyTransaction<T>) => tx.send();

/**
 * Ethers-based implementation of {@link givety-lib-base#SendableGivety}.
 *
 * @public
 */
export class SendableEthersGivety
  implements SendableGivety<EthersTransactionReceipt, EthersTransactionResponse> {
  private _populate: PopulatableEthersGivety;

  constructor(populatable: PopulatableEthersGivety) {
    this._populate = populatable;
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.openTrove} */
  async openTrove(
    params: TroveCreationParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveCreationDetails>> {
    return this._populate
      .openTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.closeTrove} */
  closeTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveClosureDetails>> {
    return this._populate.closeTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.adjustTrove} */
  adjustTrove(
    params: TroveAdjustmentParams<Decimalish>,
    maxBorrowingRateOrOptionalParams?: Decimalish | BorrowingOperationOptionalParams,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>> {
    return this._populate
      .adjustTrove(params, maxBorrowingRateOrOptionalParams, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.depositCollateral} */
  depositCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>> {
    return this._populate.depositCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.withdrawCollateral} */
  withdrawCollateral(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>> {
    return this._populate.withdrawCollateral(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.borrowGUSD} */
  borrowGUSD(
    amount: Decimalish,
    maxBorrowingRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>> {
    return this._populate.borrowGUSD(amount, maxBorrowingRate, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.repayGUSD} */
  repayGUSD(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>> {
    return this._populate.repayGUSD(amount, overrides).then(sendTransaction);
  }

  /** @internal */
  setPrice(
    price: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.setPrice(price, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.liquidate} */
  liquidate(
    address: string | string[],
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<LiquidationDetails>> {
    return this._populate.liquidate(address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.liquidateUpTo} */
  liquidateUpTo(
    maximumNumberOfTrovesToLiquidate: number,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<LiquidationDetails>> {
    return this._populate
      .liquidateUpTo(maximumNumberOfTrovesToLiquidate, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.depositGUSDInStabilityPool} */
  depositGUSDInStabilityPool(
    amount: Decimalish,
    frontendTag?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<StabilityDepositChangeDetails>> {
    return this._populate
      .depositGUSDInStabilityPool(amount, frontendTag, overrides)
      .then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.withdrawGUSDFromStabilityPool} */
  withdrawGUSDFromStabilityPool(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<StabilityDepositChangeDetails>> {
    return this._populate.withdrawGUSDFromStabilityPool(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.withdrawGainsFromStabilityPool} */
  withdrawGainsFromStabilityPool(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<StabilityPoolGainsWithdrawalDetails>> {
    return this._populate.withdrawGainsFromStabilityPool(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.transferCollateralGainToTrove} */
  transferCollateralGainToTrove(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<CollateralGainTransferDetails>> {
    return this._populate.transferCollateralGainToTrove(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.sendGUSD} */
  sendGUSD(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.sendGUSD(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.sendGVTY} */
  sendGVTY(
    toAddress: string,
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.sendGVTY(toAddress, amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.redeemGUSD} */
  redeemGUSD(
    amount: Decimalish,
    maxRedemptionRate?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<RedemptionDetails>> {
    return this._populate.redeemGUSD(amount, maxRedemptionRate, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.claimCollateralSurplus} */
  claimCollateralSurplus(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.claimCollateralSurplus(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.stakeGVTY} */
  stakeGVTY(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.stakeGVTY(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.unstakeGVTY} */
  unstakeGVTY(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.unstakeGVTY(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.withdrawGainsFromStaking} */
  withdrawGainsFromStaking(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.withdrawGainsFromStaking(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.registerFrontend} */
  registerFrontend(
    kickbackRate: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.registerFrontend(kickbackRate, overrides).then(sendTransaction);
  }

  /** @internal */
  _mintGivToken(
    amount: Decimalish,
    address?: string,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate._mintGivToken(amount, address, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.approveGivTokens} */
  approveGivTokens(
    allowance?: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.approveGivTokens(allowance, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.stakeGivTokens} */
  stakeGivTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.stakeGivTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.unstakeGivTokens} */
  unstakeGivTokens(
    amount: Decimalish,
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.unstakeGivTokens(amount, overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.withdrawGVTYRewardFromLiquidityMining} */
  withdrawGVTYRewardFromLiquidityMining(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.withdrawGVTYRewardFromLiquidityMining(overrides).then(sendTransaction);
  }

  /** {@inheritDoc givety-lib-base#SendableGivety.exitLiquidityMining} */
  exitLiquidityMining(
    overrides?: EthersTransactionOverrides
  ): Promise<SentEthersGivetyTransaction<void>> {
    return this._populate.exitLiquidityMining(overrides).then(sendTransaction);
  }
}
