import { Signer } from "@ethersproject/abstract-signer";

import {
  Decimal,
  Decimalish,
  GVTYStake,
  StabilityDeposit,
  TransactableGivety,
  Trove,
  TroveAdjustmentParams
} from "givety-lib-base";

import { EthersGivety as Givety } from "@givety/lib-ethers";

import {
  createRandomTrove,
  shortenAddress,
  benford,
  getListOfTroveOwners,
  listDifference,
  getListOfTroves,
  randomCollateralChange,
  randomDebtChange,
  objToString
} from "./utils";

import { GasHistogram } from "./GasHistogram";

type _GasHistogramsFrom<T> = {
  [P in keyof T]: T[P] extends (...args: never[]) => Promise<infer R> ? GasHistogram<R> : never;
};

type GasHistograms = Pick<
  _GasHistogramsFrom<TransactableGivety>,
  | "openTrove"
  | "adjustTrove"
  | "closeTrove"
  | "redeemGUSD"
  | "depositGUSDInStabilityPool"
  | "withdrawGUSDFromStabilityPool"
  | "stakeGVTY"
  | "unstakeGVTY"
>;

export class Fixture {
  private readonly deployerGivety: Givety;
  private readonly funder: Signer;
  private readonly funderGivety: Givety;
  private readonly funderAddress: string;
  private readonly frontendAddress: string;
  private readonly gasHistograms: GasHistograms;

  private price: Decimal;

  totalNumberOfLiquidations = 0;

  private constructor(
    deployerGivety: Givety,
    funder: Signer,
    funderGivety: Givety,
    funderAddress: string,
    frontendAddress: string,
    price: Decimal
  ) {
    this.deployerGivety = deployerGivety;
    this.funder = funder;
    this.funderGivety = funderGivety;
    this.funderAddress = funderAddress;
    this.frontendAddress = frontendAddress;
    this.price = price;

    this.gasHistograms = {
      openTrove: new GasHistogram(),
      adjustTrove: new GasHistogram(),
      closeTrove: new GasHistogram(),
      redeemGUSD: new GasHistogram(),
      depositGUSDInStabilityPool: new GasHistogram(),
      withdrawGUSDFromStabilityPool: new GasHistogram(),
      stakeGVTY: new GasHistogram(),
      unstakeGVTY: new GasHistogram()
    };
  }

  static async setup(
    deployerGivety: Givety,
    funder: Signer,
    funderGivety: Givety,
    frontendAddress: string,
    frontendGivety: Givety
  ) {
    const funderAddress = await funder.getAddress();
    const price = await deployerGivety.getPrice();

    await frontendGivety.registerFrontend(Decimal.from(10).div(11));

    return new Fixture(
      deployerGivety,
      funder,
      funderGivety,
      funderAddress,
      frontendAddress,
      price
    );
  }

  private async sendGUSDFromFunder(toAddress: string, amount: Decimalish) {
    amount = Decimal.from(amount);

    const gusdBalance = await this.funderGivety.getGUSDBalance();

    if (gusdBalance.lt(amount)) {
      const trove = await this.funderGivety.getTrove();
      const total = await this.funderGivety.getTotal();
      const fees = await this.funderGivety.getFees();

      const targetCollateralRatio =
        trove.isEmpty || !total.collateralRatioIsBelowCritical(this.price)
          ? 1.51
          : Decimal.max(trove.collateralRatio(this.price).add(0.00001), 1.11);

      let newTrove = trove.isEmpty ? Trove.create({ depositCollateral: 1 }) : trove;
      newTrove = newTrove.adjust({ borrowGUSD: amount.sub(gusdBalance).mul(2) });
      newTrove = newTrove.setCollateral(newTrove.debt.mulDiv(targetCollateralRatio, this.price));

      if (trove.isEmpty) {
        const params = Trove.recreate(newTrove, fees.borrowingRate());
        console.log(`[funder] openTrove(${objToString(params)})`);
        await this.funderGivety.openTrove(params);
      } else {
        let newTotal = total.add(newTrove).subtract(trove);

        if (
          !total.collateralRatioIsBelowCritical(this.price) &&
          newTotal.collateralRatioIsBelowCritical(this.price)
        ) {
          newTotal = newTotal.setCollateral(newTotal.debt.mulDiv(1.51, this.price));
          newTrove = trove.add(newTotal).subtract(total);
        }

        const params = trove.adjustTo(newTrove, fees.borrowingRate());
        console.log(`[funder] adjustTrove(${objToString(params)})`);
        await this.funderGivety.adjustTrove(params);
      }
    }

    await this.funderGivety.sendGUSD(toAddress, amount);
  }

  async setRandomPrice() {
    this.price = this.price.add(200 * Math.random() + 100).div(2);
    console.log(`[deployer] setPrice(${this.price})`);
    await this.deployerGivety.setPrice(this.price);

    return this.price;
  }

  async liquidateRandomNumberOfTroves(price: Decimal) {
    const gusdInStabilityPoolBefore = await this.deployerGivety.getGUSDInStabilityPool();
    console.log(`// Stability Pool balance: ${gusdInStabilityPoolBefore}`);

    const trovesBefore = await getListOfTroves(this.deployerGivety);

    if (trovesBefore.length === 0) {
      console.log("// No Troves to liquidate");
      return;
    }

    const troveOwnersBefore = trovesBefore.map(([owner]) => owner);
    const [, lastTrove] = trovesBefore[trovesBefore.length - 1];

    if (!lastTrove.collateralRatioIsBelowMinimum(price)) {
      console.log("// No Troves to liquidate");
      return;
    }

    const maximumNumberOfTrovesToLiquidate = Math.floor(50 * Math.random()) + 1;
    console.log(`[deployer] liquidateUpTo(${maximumNumberOfTrovesToLiquidate})`);
    await this.deployerGivety.liquidateUpTo(maximumNumberOfTrovesToLiquidate);

    const troveOwnersAfter = await getListOfTroveOwners(this.deployerGivety);
    const liquidatedTroves = listDifference(troveOwnersBefore, troveOwnersAfter);

    if (liquidatedTroves.length > 0) {
      for (const liquidatedTrove of liquidatedTroves) {
        console.log(`// Liquidated ${shortenAddress(liquidatedTrove)}`);
      }
    }

    this.totalNumberOfLiquidations += liquidatedTroves.length;

    const gusdInStabilityPoolAfter = await this.deployerGivety.getGUSDInStabilityPool();
    console.log(`// Stability Pool balance: ${gusdInStabilityPoolAfter}`);
  }

  async openRandomTrove(userAddress: string, givety: Givety) {
    const total = await givety.getTotal();
    const fees = await givety.getFees();

    let newTrove: Trove;

    const cannotOpen = (newTrove: Trove) =>
      total.collateralRatioIsBelowCritical(this.price)
        ? newTrove.collateralRatioIsBelowCritical(this.price)
        : newTrove.collateralRatioIsBelowMinimum(this.price) ||
          total.add(newTrove).collateralRatioIsBelowCritical(this.price);

    // do {
    newTrove = createRandomTrove(this.price);
    // } while (cannotOpen(newTrove));

    await this.funder.sendTransaction({
      to: userAddress,
      value: newTrove.collateral.hex
    });

    const params = Trove.recreate(newTrove, fees.borrowingRate());

    if (cannotOpen(newTrove)) {
      console.log(
        `// [${shortenAddress(userAddress)}] openTrove(${objToString(params)}) expected to fail`
      );

      await this.gasHistograms.openTrove.expectFailure(() =>
        givety.openTrove(params, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] openTrove(${objToString(params)})`);

      await this.gasHistograms.openTrove.expectSuccess(() =>
        givety.send.openTrove(params, { gasPrice: 0 })
      );
    }
  }

  async randomlyAdjustTrove(userAddress: string, givety: Givety, trove: Trove) {
    const total = await givety.getTotal();
    const fees = await givety.getFees();
    const x = Math.random();

    const params: TroveAdjustmentParams<Decimal> =
      x < 0.333
        ? randomCollateralChange(trove)
        : x < 0.666
        ? randomDebtChange(trove)
        : { ...randomCollateralChange(trove), ...randomDebtChange(trove) };

    const cannotAdjust = (trove: Trove, params: TroveAdjustmentParams<Decimal>) => {
      if (params.withdrawCollateral?.gte(trove.collateral) || params.repayGUSD?.gt(trove.netDebt)) {
        return true;
      }

      const adjusted = trove.adjust(params, fees.borrowingRate());

      return (
        (params.withdrawCollateral?.nonZero || params.borrowGUSD?.nonZero) &&
        (adjusted.collateralRatioIsBelowMinimum(this.price) ||
          (total.collateralRatioIsBelowCritical(this.price)
            ? adjusted._nominalCollateralRatio.lt(trove._nominalCollateralRatio)
            : total.add(adjusted).subtract(trove).collateralRatioIsBelowCritical(this.price)))
      );
    };

    if (params.depositCollateral) {
      await this.funder.sendTransaction({
        to: userAddress,
        value: params.depositCollateral.hex
      });
    }

    if (params.repayGUSD) {
      await this.sendGUSDFromFunder(userAddress, params.repayGUSD);
    }

    if (cannotAdjust(trove, params)) {
      console.log(
        `// [${shortenAddress(userAddress)}] adjustTrove(${objToString(params)}) expected to fail`
      );

      await this.gasHistograms.adjustTrove.expectFailure(() =>
        givety.adjustTrove(params, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] adjustTrove(${objToString(params)})`);

      await this.gasHistograms.adjustTrove.expectSuccess(() =>
        givety.send.adjustTrove(params, { gasPrice: 0 })
      );
    }
  }

  async closeTrove(userAddress: string, givety: Givety, trove: Trove) {
    const total = await givety.getTotal();

    if (total.collateralRatioIsBelowCritical(this.price)) {
      // Cannot close Trove during recovery mode
      console.log("// Skipping closeTrove() in recovery mode");
      return;
    }

    await this.sendGUSDFromFunder(userAddress, trove.netDebt);

    console.log(`[${shortenAddress(userAddress)}] closeTrove()`);

    await this.gasHistograms.closeTrove.expectSuccess(() =>
      givety.send.closeTrove({ gasPrice: 0 })
    );
  }

  async redeemRandomAmount(userAddress: string, givety: Givety) {
    const total = await givety.getTotal();

    if (total.collateralRatioIsBelowMinimum(this.price)) {
      console.log("// Skipping redeemGUSD() when TCR < MCR");
      return;
    }

    const amount = benford(10000);
    await this.sendGUSDFromFunder(userAddress, amount);

    console.log(`[${shortenAddress(userAddress)}] redeemGUSD(${amount})`);

    await this.gasHistograms.redeemGUSD.expectSuccess(() =>
      givety.send.redeemGUSD(amount, { gasPrice: 0 })
    );
  }

  async depositRandomAmountInStabilityPool(userAddress: string, givety: Givety) {
    const amount = benford(20000);

    await this.sendGUSDFromFunder(userAddress, amount);

    console.log(`[${shortenAddress(userAddress)}] depositGUSDInStabilityPool(${amount})`);

    await this.gasHistograms.depositGUSDInStabilityPool.expectSuccess(() =>
      givety.send.depositGUSDInStabilityPool(amount, this.frontendAddress, {
        gasPrice: 0
      })
    );
  }

  async withdrawRandomAmountFromStabilityPool(
    userAddress: string,
    givety: Givety,
    deposit: StabilityDeposit
  ) {
    const [[, lastTrove]] = await givety.getTroves({
      first: 1,
      sortedBy: "ascendingCollateralRatio"
    });

    const amount = deposit.currentGUSD.mul(1.1 * Math.random()).add(10 * Math.random());

    const cannotWithdraw = (amount: Decimal) =>
      amount.nonZero && lastTrove.collateralRatioIsBelowMinimum(this.price);

    if (cannotWithdraw(amount)) {
      console.log(
        `// [${shortenAddress(userAddress)}] ` +
          `withdrawGUSDFromStabilityPool(${amount}) expected to fail`
      );

      await this.gasHistograms.withdrawGUSDFromStabilityPool.expectFailure(() =>
        givety.withdrawGUSDFromStabilityPool(amount, { gasPrice: 0 })
      );
    } else {
      console.log(`[${shortenAddress(userAddress)}] withdrawGUSDFromStabilityPool(${amount})`);

      await this.gasHistograms.withdrawGUSDFromStabilityPool.expectSuccess(() =>
        givety.send.withdrawGUSDFromStabilityPool(amount, { gasPrice: 0 })
      );
    }
  }

  async stakeRandomAmount(userAddress: string, givety: Givety) {
    const gvtyBalance = await this.funderGivety.getGVTYBalance();
    const amount = gvtyBalance.mul(Math.random() / 2);

    await this.funderGivety.sendGVTY(userAddress, amount);

    console.log(`[${shortenAddress(userAddress)}] stakeGVTY(${amount})`);

    await this.gasHistograms.stakeGVTY.expectSuccess(() =>
      givety.send.stakeGVTY(amount, { gasPrice: 0 })
    );
  }

  async unstakeRandomAmount(userAddress: string, givety: Givety, stake: GVTYStake) {
    const amount = stake.stakedGVTY.mul(1.1 * Math.random()).add(10 * Math.random());

    console.log(`[${shortenAddress(userAddress)}] unstakeGVTY(${amount})`);

    await this.gasHistograms.unstakeGVTY.expectSuccess(() =>
      givety.send.unstakeGVTY(amount, { gasPrice: 0 })
    );
  }

  async sweepGUSD(givety: Givety) {
    const gusdBalance = await givety.getGUSDBalance();

    if (gusdBalance.nonZero) {
      await givety.sendGUSD(this.funderAddress, gusdBalance, { gasPrice: 0 });
    }
  }

  async sweepGVTY(givety: Givety) {
    const gvtyBalance = await givety.getGVTYBalance();

    if (gvtyBalance.nonZero) {
      await givety.sendGVTY(this.funderAddress, gvtyBalance, { gasPrice: 0 });
    }
  }

  summarizeGasStats(): string {
    return Object.entries(this.gasHistograms)
      .map(([name, histo]) => {
        const results = histo.getResults();

        return (
          `${name},outOfGas,${histo.outOfGasFailures}\n` +
          `${name},failure,${histo.expectedFailures}\n` +
          results
            .map(([intervalMin, frequency]) => `${name},success,${frequency},${intervalMin}\n`)
            .join("")
        );
      })
      .join("");
  }
}
