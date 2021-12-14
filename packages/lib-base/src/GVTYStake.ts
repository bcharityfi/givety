import { Decimal, Decimalish } from "./Decimal";

/**
 * Represents the change between two states of an GVTY Stake.
 *
 * @public
 */
export type GVTYStakeChange<T> =
  | { stakeGVTY: T; unstakeGVTY?: undefined }
  | { stakeGVTY?: undefined; unstakeGVTY: T; unstakeAllGVTY: boolean };

/** 
 * Represents a user's GVTY stake and accrued gains.
 * 
 * @remarks
 * Returned by the {@link ReadableGivety.getGVTYStake | getGVTYStake()} function.

 * @public
 */
export class GVTYStake {
  /** The amount of GVTY that's staked. */
  readonly stakedGVTY: Decimal;

  /** Collateral gain available to withdraw. */
  readonly collateralGain: Decimal;

  /** GUSD gain available to withdraw. */
  readonly gusdGain: Decimal;

  /** @internal */
  constructor(stakedGVTY = Decimal.ZERO, collateralGain = Decimal.ZERO, gusdGain = Decimal.ZERO) {
    this.stakedGVTY = stakedGVTY;
    this.collateralGain = collateralGain;
    this.gusdGain = gusdGain;
  }

  get isEmpty(): boolean {
    return this.stakedGVTY.isZero && this.collateralGain.isZero && this.gusdGain.isZero;
  }

  /** @internal */
  toString(): string {
    return (
      `{ stakedGVTY: ${this.stakedGVTY}` +
      `, collateralGain: ${this.collateralGain}` +
      `, gusdGain: ${this.gusdGain} }`
    );
  }

  /**
   * Compare to another instance of `GVTYStake`.
   */
  equals(that: GVTYStake): boolean {
    return (
      this.stakedGVTY.eq(that.stakedGVTY) &&
      this.collateralGain.eq(that.collateralGain) &&
      this.gusdGain.eq(that.gusdGain)
    );
  }

  /**
   * Calculate the difference between this `GVTYStake` and `thatStakedGVTY`.
   *
   * @returns An object representing the change, or `undefined` if the staked amounts are equal.
   */
  whatChanged(thatStakedGVTY: Decimalish): GVTYStakeChange<Decimal> | undefined {
    thatStakedGVTY = Decimal.from(thatStakedGVTY);

    if (thatStakedGVTY.lt(this.stakedGVTY)) {
      return {
        unstakeGVTY: this.stakedGVTY.sub(thatStakedGVTY),
        unstakeAllGVTY: thatStakedGVTY.isZero
      };
    }

    if (thatStakedGVTY.gt(this.stakedGVTY)) {
      return { stakeGVTY: thatStakedGVTY.sub(this.stakedGVTY) };
    }
  }

  /**
   * Apply a {@link GVTYStakeChange} to this `GVTYStake`.
   *
   * @returns The new staked GVTY amount.
   */
  apply(change: GVTYStakeChange<Decimalish> | undefined): Decimal {
    if (!change) {
      return this.stakedGVTY;
    }

    if (change.unstakeGVTY !== undefined) {
      return change.unstakeAllGVTY || this.stakedGVTY.lte(change.unstakeGVTY)
        ? Decimal.ZERO
        : this.stakedGVTY.sub(change.unstakeGVTY);
    } else {
      return this.stakedGVTY.add(change.stakeGVTY);
    }
  }
}
