import { Decimal, Decimalish } from "./Decimal";

/**
 * Represents the change between two Stability Deposit states.
 *
 * @public
 */
export type StabilityDepositChange<T> =
  | { depositGUSD: T; withdrawGUSD?: undefined }
  | { depositGUSD?: undefined; withdrawGUSD: T; withdrawAllGUSD: boolean };

/**
 * A Stability Deposit and its accrued gains.
 *
 * @public
 */
export class StabilityDeposit {
  /** Amount of GUSD in the Stability Deposit at the time of the last direct modification. */
  readonly initialGUSD: Decimal;

  /** Amount of GUSD left in the Stability Deposit. */
  readonly currentGUSD: Decimal;

  /** Amount of native currency (e.g. Give) received in exchange for the used-up GUSD. */
  readonly collateralGain: Decimal;

  /** Amount of GVTY rewarded since the last modification of the Stability Deposit. */
  readonly gvtyReward: Decimal;

  /**
   * Address of frontend through which this Stability Deposit was made.
   *
   * @remarks
   * If the Stability Deposit was made through a frontend that doesn't tag deposits, this will be
   * the zero-address.
   */
  readonly frontendTag: string;

  /** @internal */
  constructor(
    initialGUSD: Decimal,
    currentGUSD: Decimal,
    collateralGain: Decimal,
    gvtyReward: Decimal,
    frontendTag: string
  ) {
    this.initialGUSD = initialGUSD;
    this.currentGUSD = currentGUSD;
    this.collateralGain = collateralGain;
    this.gvtyReward = gvtyReward;
    this.frontendTag = frontendTag;

    if (this.currentGUSD.gt(this.initialGUSD)) {
      throw new Error("currentGUSD can't be greater than initialGUSD");
    }
  }

  get isEmpty(): boolean {
    return (
      this.initialGUSD.isZero &&
      this.currentGUSD.isZero &&
      this.collateralGain.isZero &&
      this.gvtyReward.isZero
    );
  }

  /** @internal */
  toString(): string {
    return (
      `{ initialGUSD: ${this.initialGUSD}` +
      `, currentGUSD: ${this.currentGUSD}` +
      `, collateralGain: ${this.collateralGain}` +
      `, gvtyReward: ${this.gvtyReward}` +
      `, frontendTag: "${this.frontendTag}" }`
    );
  }

  /**
   * Compare to another instance of `StabilityDeposit`.
   */
  equals(that: StabilityDeposit): boolean {
    return (
      this.initialGUSD.eq(that.initialGUSD) &&
      this.currentGUSD.eq(that.currentGUSD) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.gvtyReward.eq(that.gvtyReward) &&
      this.frontendTag === that.frontendTag
    );
  }

  /**
   * Calculate the difference between the `currentGUSD` in this Stability Deposit and `thatGUSD`.
   *
   * @returns An object representing the change, or `undefined` if the deposited amounts are equal.
   */
  whatChanged(thatGUSD: Decimalish): StabilityDepositChange<Decimal> | undefined {
    thatGUSD = Decimal.from(thatGUSD);

    if (thatGUSD.lt(this.currentGUSD)) {
      return { withdrawGUSD: this.currentGUSD.sub(thatGUSD), withdrawAllGUSD: thatGUSD.isZero };
    }

    if (thatGUSD.gt(this.currentGUSD)) {
      return { depositGUSD: thatGUSD.sub(this.currentGUSD) };
    }
  }

  /**
   * Apply a {@link StabilityDepositChange} to this Stability Deposit.
   *
   * @returns The new deposited GUSD amount.
   */
  apply(change: StabilityDepositChange<Decimalish> | undefined): Decimal {
    if (!change) {
      return this.currentGUSD;
    }

    if (change.withdrawGUSD !== undefined) {
      return change.withdrawAllGUSD || this.currentGUSD.lte(change.withdrawGUSD)
        ? Decimal.ZERO
        : this.currentGUSD.sub(change.withdrawGUSD);
    } else {
      return this.currentGUSD.add(change.depositGUSD);
    }
  }
}
