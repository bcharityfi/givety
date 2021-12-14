import { AddressZero } from "@ethersproject/constants";

import {
  Decimal,
  GivetyStoreState,
  GivetyStoreBaseState,
  TroveWithPendingRedistribution,
  StabilityDeposit,
  GVTYStake,
  GivetyStore,
  Fees
} from "givety-lib-base";

import { decimalify, promiseAllValues } from "./_utils";
import { ReadableEthersGivety } from "./ReadableEthersGivety";
import { EthersGivetyConnection, _getProvider } from "./EthersGivetyConnection";
import { EthersCallOverrides, EthersProvider } from "./types";

/**
 * Extra state added to {@link givety-lib-base#GivetyStoreState} by
 * {@link BlockPolledGivetyStore}.
 *
 * @public
 */
export interface BlockPolledGivetyStoreExtraState {
  /**
   * Number of block that the store state was fetched from.
   *
   * @remarks
   * May be undefined when the store state is fetched for the first time.
   */
  blockTag?: number;

  /**
   * Timestamp of latest block (number of seconds since epoch).
   */
  blockTimestamp: number;

  /** @internal */
  _feesFactory: (blockTimestamp: number, recoveryMode: boolean) => Fees;
}

/**
 * The type of {@link BlockPolledGivetyStore}'s
 * {@link givety-lib-base#GivetyStore.state | state}.
 *
 * @public
 */
export type BlockPolledGivetyStoreState = GivetyStoreState<BlockPolledGivetyStoreExtraState>;

/**
 * Ethers-based {@link givety-lib-base#GivetyStore} that updates state whenever there's a new
 * block.
 *
 * @public
 */
export class BlockPolledGivetyStore extends GivetyStore<BlockPolledGivetyStoreExtraState> {
  readonly connection: EthersGivetyConnection;

  private readonly _readable: ReadableEthersGivety;
  private readonly _provider: EthersProvider;

  constructor(readable: ReadableEthersGivety) {
    super();

    this.connection = readable.connection;
    this._readable = readable;
    this._provider = _getProvider(readable.connection);
  }

  private async _getRiskiestTroveBeforeRedistribution(
    overrides?: EthersCallOverrides
  ): Promise<TroveWithPendingRedistribution> {
    const riskiestTroves = await this._readable.getTroves(
      { first: 1, sortedBy: "ascendingCollateralRatio", beforeRedistribution: true },
      overrides
    );

    if (riskiestTroves.length === 0) {
      return new TroveWithPendingRedistribution(AddressZero, "nonExistent");
    }

    return riskiestTroves[0];
  }

  private async _get(
    blockTag?: number
  ): Promise<[baseState: GivetyStoreBaseState, extraState: BlockPolledGivetyStoreExtraState]> {
    const { userAddress, frontendTag } = this.connection;

    const {
      blockTimestamp,
      _feesFactory,
      calculateRemainingGVTY,
      ...baseState
    } = await promiseAllValues({
      blockTimestamp: this._readable._getBlockTimestamp(blockTag),
      _feesFactory: this._readable._getFeesFactory({ blockTag }),
      calculateRemainingGVTY: this._readable._getRemainingLiquidityMiningGVTYRewardCalculator({
        blockTag
      }),

      price: this._readable.getPrice({ blockTag }),
      numberOfTroves: this._readable.getNumberOfTroves({ blockTag }),
      totalRedistributed: this._readable.getTotalRedistributed({ blockTag }),
      total: this._readable.getTotal({ blockTag }),
      gusdInStabilityPool: this._readable.getGUSDInStabilityPool({ blockTag }),
      totalStakedGVTY: this._readable.getTotalStakedGVTY({ blockTag }),
      _riskiestTroveBeforeRedistribution: this._getRiskiestTroveBeforeRedistribution({ blockTag }),
      totalStakedGivTokens: this._readable.getTotalStakedGivTokens({ blockTag }),
      remainingStabilityPoolGVTYReward: this._readable.getRemainingStabilityPoolGVTYReward({
        blockTag
      }),

      frontend: frontendTag
        ? this._readable.getFrontendStatus(frontendTag, { blockTag })
        : { status: "unregistered" as const },

      ...(userAddress
        ? {
            accountBalance: this._provider.getBalance(userAddress, blockTag).then(decimalify),
            gusdBalance: this._readable.getGUSDBalance(userAddress, { blockTag }),
            gvtyBalance: this._readable.getGVTYBalance(userAddress, { blockTag }),
            givTokenBalance: this._readable.getGivTokenBalance(userAddress, { blockTag }),
            givTokenAllowance: this._readable.getGivTokenAllowance(userAddress, { blockTag }),
            liquidityMiningStake: this._readable.getLiquidityMiningStake(userAddress, { blockTag }),
            liquidityMiningGVTYReward: this._readable.getLiquidityMiningGVTYReward(userAddress, {
              blockTag
            }),
            collateralSurplusBalance: this._readable.getCollateralSurplusBalance(userAddress, {
              blockTag
            }),
            troveBeforeRedistribution: this._readable.getTroveBeforeRedistribution(userAddress, {
              blockTag
            }),
            stabilityDeposit: this._readable.getStabilityDeposit(userAddress, { blockTag }),
            gvtyStake: this._readable.getGVTYStake(userAddress, { blockTag }),
            ownFrontend: this._readable.getFrontendStatus(userAddress, { blockTag })
          }
        : {
            accountBalance: Decimal.ZERO,
            gusdBalance: Decimal.ZERO,
            gvtyBalance: Decimal.ZERO,
            givTokenBalance: Decimal.ZERO,
            givTokenAllowance: Decimal.ZERO,
            liquidityMiningStake: Decimal.ZERO,
            liquidityMiningGVTYReward: Decimal.ZERO,
            collateralSurplusBalance: Decimal.ZERO,
            troveBeforeRedistribution: new TroveWithPendingRedistribution(
              AddressZero,
              "nonExistent"
            ),
            stabilityDeposit: new StabilityDeposit(
              Decimal.ZERO,
              Decimal.ZERO,
              Decimal.ZERO,
              Decimal.ZERO,
              AddressZero
            ),
            gvtyStake: new GVTYStake(),
            ownFrontend: { status: "unregistered" as const }
          })
    });

    return [
      {
        ...baseState,
        _feesInNormalMode: _feesFactory(blockTimestamp, false),
        remainingLiquidityMiningGVTYReward: calculateRemainingGVTY(blockTimestamp)
      },
      {
        blockTag,
        blockTimestamp,
        _feesFactory
      }
    ];
  }

  /** @internal @override */
  protected _doStart(): () => void {
    this._get().then(state => {
      if (!this._loaded) {
        this._load(...state);
      }
    });

    const blockListener = async (blockTag: number) => {
      const state = await this._get(blockTag);

      if (this._loaded) {
        this._update(...state);
      } else {
        this._load(...state);
      }
    };

    this._provider.on("block", blockListener);

    return () => {
      this._provider.off("block", blockListener);
    };
  }

  /** @internal @override */
  protected _reduceExtra(
    oldState: BlockPolledGivetyStoreExtraState,
    stateUpdate: Partial<BlockPolledGivetyStoreExtraState>
  ): BlockPolledGivetyStoreExtraState {
    return {
      blockTag: stateUpdate.blockTag ?? oldState.blockTag,
      blockTimestamp: stateUpdate.blockTimestamp ?? oldState.blockTimestamp,
      _feesFactory: stateUpdate._feesFactory ?? oldState._feesFactory
    };
  }
}
