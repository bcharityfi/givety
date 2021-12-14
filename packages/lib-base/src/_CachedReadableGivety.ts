import { Decimal } from "./Decimal";
import { Fees } from "./Fees";
import { GVTYStake } from "./GVTYStake";
import { StabilityDeposit } from "./StabilityDeposit";
import { Trove, TroveWithPendingRedistribution, UserTrove } from "./Trove";
import { FrontendStatus, ReadableGivety, TroveListingParams } from "./ReadableGivety";

/** @internal */
export type _ReadableGivetyWithExtraParamsBase<T extends unknown[]> = {
  [P in keyof ReadableGivety]: ReadableGivety[P] extends (...params: infer A) => infer R
    ? (...params: [...originalParams: A, ...extraParams: T]) => R
    : never;
};

/** @internal */
export type _GivetyReadCacheBase<T extends unknown[]> = {
  [P in keyof ReadableGivety]: ReadableGivety[P] extends (...args: infer A) => Promise<infer R>
    ? (...params: [...originalParams: A, ...extraParams: T]) => R | undefined
    : never;
};

// Overloads get lost in the mapping, so we need to define them again...

/** @internal */
export interface _ReadableGivetyWithExtraParams<T extends unknown[]>
  extends _ReadableGivetyWithExtraParamsBase<T> {
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]>;
}

/** @internal */
export interface _GivetyReadCache<T extends unknown[]> extends _GivetyReadCacheBase<T> {
  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): TroveWithPendingRedistribution[] | undefined;

  getTroves(params: TroveListingParams, ...extraParams: T): UserTrove[] | undefined;
}

/** @internal */
export class _CachedReadableGivety<T extends unknown[]>
  implements _ReadableGivetyWithExtraParams<T> {
  private _readable: _ReadableGivetyWithExtraParams<T>;
  private _cache: _GivetyReadCache<T>;

  constructor(readable: _ReadableGivetyWithExtraParams<T>, cache: _GivetyReadCache<T>) {
    this._readable = readable;
    this._cache = cache;
  }

  async getTotalRedistributed(...extraParams: T): Promise<Trove> {
    return (
      this._cache.getTotalRedistributed(...extraParams) ??
      this._readable.getTotalRedistributed(...extraParams)
    );
  }

  async getTroveBeforeRedistribution(
    address?: string,
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution> {
    return (
      this._cache.getTroveBeforeRedistribution(address, ...extraParams) ??
      this._readable.getTroveBeforeRedistribution(address, ...extraParams)
    );
  }

  async getTrove(address?: string, ...extraParams: T): Promise<UserTrove> {
    const [troveBeforeRedistribution, totalRedistributed] = await Promise.all([
      this.getTroveBeforeRedistribution(address, ...extraParams),
      this.getTotalRedistributed(...extraParams)
    ]);

    return troveBeforeRedistribution.applyRedistribution(totalRedistributed);
  }

  async getNumberOfTroves(...extraParams: T): Promise<number> {
    return (
      this._cache.getNumberOfTroves(...extraParams) ??
      this._readable.getNumberOfTroves(...extraParams)
    );
  }

  async getPrice(...extraParams: T): Promise<Decimal> {
    return this._cache.getPrice(...extraParams) ?? this._readable.getPrice(...extraParams);
  }

  async getTotal(...extraParams: T): Promise<Trove> {
    return this._cache.getTotal(...extraParams) ?? this._readable.getTotal(...extraParams);
  }

  async getStabilityDeposit(address?: string, ...extraParams: T): Promise<StabilityDeposit> {
    return (
      this._cache.getStabilityDeposit(address, ...extraParams) ??
      this._readable.getStabilityDeposit(address, ...extraParams)
    );
  }

  async getRemainingStabilityPoolGVTYReward(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getRemainingStabilityPoolGVTYReward(...extraParams) ??
      this._readable.getRemainingStabilityPoolGVTYReward(...extraParams)
    );
  }

  async getGUSDInStabilityPool(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getGUSDInStabilityPool(...extraParams) ??
      this._readable.getGUSDInStabilityPool(...extraParams)
    );
  }

  async getGUSDBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getGUSDBalance(address, ...extraParams) ??
      this._readable.getGUSDBalance(address, ...extraParams)
    );
  }

  async getGVTYBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getGVTYBalance(address, ...extraParams) ??
      this._readable.getGVTYBalance(address, ...extraParams)
    );
  }

  async getGivTokenBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getGivTokenBalance(address, ...extraParams) ??
      this._readable.getGivTokenBalance(address, ...extraParams)
    );
  }

  async getGivTokenAllowance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getGivTokenAllowance(address, ...extraParams) ??
      this._readable.getGivTokenAllowance(address, ...extraParams)
    );
  }

  async getRemainingLiquidityMiningGVTYReward(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getRemainingLiquidityMiningGVTYReward(...extraParams) ??
      this._readable.getRemainingLiquidityMiningGVTYReward(...extraParams)
    );
  }

  async getLiquidityMiningStake(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getLiquidityMiningStake(address, ...extraParams) ??
      this._readable.getLiquidityMiningStake(address, ...extraParams)
    );
  }

  async getTotalStakedGivTokens(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getTotalStakedGivTokens(...extraParams) ??
      this._readable.getTotalStakedGivTokens(...extraParams)
    );
  }

  async getLiquidityMiningGVTYReward(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getLiquidityMiningGVTYReward(address, ...extraParams) ??
      this._readable.getLiquidityMiningGVTYReward(address, ...extraParams)
    );
  }

  async getCollateralSurplusBalance(address?: string, ...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getCollateralSurplusBalance(address, ...extraParams) ??
      this._readable.getCollateralSurplusBalance(address, ...extraParams)
    );
  }

  getTroves(
    params: TroveListingParams & { beforeRedistribution: true },
    ...extraParams: T
  ): Promise<TroveWithPendingRedistribution[]>;

  getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]>;

  async getTroves(params: TroveListingParams, ...extraParams: T): Promise<UserTrove[]> {
    const { beforeRedistribution, ...restOfParams } = params;

    const [totalRedistributed, troves] = await Promise.all([
      beforeRedistribution ? undefined : this.getTotalRedistributed(...extraParams),
      this._cache.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams) ??
        this._readable.getTroves({ beforeRedistribution: true, ...restOfParams }, ...extraParams)
    ]);

    if (totalRedistributed) {
      return troves.map(trove => trove.applyRedistribution(totalRedistributed));
    } else {
      return troves;
    }
  }

  async getFees(...extraParams: T): Promise<Fees> {
    return this._cache.getFees(...extraParams) ?? this._readable.getFees(...extraParams);
  }

  async getGVTYStake(address?: string, ...extraParams: T): Promise<GVTYStake> {
    return (
      this._cache.getGVTYStake(address, ...extraParams) ??
      this._readable.getGVTYStake(address, ...extraParams)
    );
  }

  async getTotalStakedGVTY(...extraParams: T): Promise<Decimal> {
    return (
      this._cache.getTotalStakedGVTY(...extraParams) ??
      this._readable.getTotalStakedGVTY(...extraParams)
    );
  }

  async getFrontendStatus(address?: string, ...extraParams: T): Promise<FrontendStatus> {
    return (
      this._cache.getFrontendStatus(address, ...extraParams) ??
      this._readable.getFrontendStatus(address, ...extraParams)
    );
  }
}
