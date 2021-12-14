import yargs from "yargs";
import fs from "fs";
import dotenv from "dotenv";
import "colors";

import { Wallet } from "@ethersproject/wallet";
import { JsonRpcProvider } from "@ethersproject/providers";

import {
  Decimal,
  Difference,
  GUSD_LIQUIDATION_RESERVE,
  Trove,
  TroveWithPendingRedistribution
} from "givety-lib-base";

import { EthersGivety as Givety } from "@givety/lib-ethers";
import { SubgraphGivety } from "@givety/lib-subgraph";

import {
  checkPoolBalances,
  checkSubgraph,
  checkTroveOrdering,
  connectUsers,
  createRandomWallets,
  dumpTroves,
  getListOfTrovesBeforeRedistribution,
  shortenAddress
} from "./utils";

import { Fixture } from "./Fixture";

dotenv.config();

const provider = new JsonRpcProvider("http://localhost:8545");
const subgraph = new SubgraphGivety("http://localhost:8000/subgraphs/name/givety/subgraph");

const deployer = process.env.DEPLOYER_PRIVATE_KEY
  ? new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
  : Wallet.createRandom().connect(provider);

const funder = new Wallet(
  "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7",
  provider
);

yargs
  .scriptName("yarn fuzzer")

  .command(
    "warzone",
    "Create lots of Troves.",
    {
      troves: {
        alias: "n",
        default: 1000,
        description: "Number of troves to create"
      }
    },
    async ({ troves }) => {
      const deployerGivety = await Givety.connect(deployer);

      const price = await deployerGivety.getPrice();

      for (let i = 1; i <= troves; ++i) {
        const user = Wallet.createRandom().connect(provider);
        const userAddress = await user.getAddress();
        const debt = GUSD_LIQUIDATION_RESERVE.add(99999 * Math.random());
        const collateral = debt.mul(price).mul(1.11 + 3 * Math.random());

        const givety = await Givety.connect(user);

        await funder.sendTransaction({
          to: userAddress,
          value: Decimal.from(collateral).hex
        });

        const fees = await givety.getFees();
        await givety.openTrove(Trove.recreate(new Trove(collateral, debt), fees.borrowingRate()), {
          gasPrice: 0
        });

        if (i % 4 === 0) {
          const gusdBalance = await givety.getGUSDBalance();
          await givety.depositGUSDInStabilityPool(gusdBalance);
        }

        if (i % 10 === 0) {
          console.log(`Created ${i} Troves.`);
        }

        //await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }
  )

  .command(
    "chaos",
    "Try to break Givety by randomly interacting with it.",
    {
      users: {
        alias: "u",
        default: 40,
        description: "Number of users to spawn"
      },
      rounds: {
        alias: "n",
        default: 25,
        description: "How many times each user should interact with Givety"
      },
      subgraph: {
        alias: "g",
        default: false,
        description: "Check after every round that subgraph data matches layer 1"
      }
    },
    async ({ rounds: numberOfRounds, users: numberOfUsers, subgraph: shouldCheckSubgraph }) => {
      const [frontend, ...randomUsers] = createRandomWallets(numberOfUsers + 1, provider);

      const [
        deployerGivety,
        funderGivety,
        frontendGivety,
        ...randomLiquities
      ] = await connectUsers([deployer, funder, frontend, ...randomUsers]);

      const fixture = await Fixture.setup(
        deployerGivety,
        funder,
        funderGivety,
        frontend.address,
        frontendGivety
      );

      let previousListOfTroves: [string, TroveWithPendingRedistribution][] | undefined = undefined;

      console.log();
      console.log("// Keys");
      console.log(`[frontend]: ${frontend.privateKey}`);
      randomUsers.forEach(user =>
        console.log(`[${shortenAddress(user.address)}]: ${user.privateKey}`)
      );

      for (let i = 1; i <= numberOfRounds; ++i) {
        console.log();
        console.log(`// Round #${i}`);

        const price = await fixture.setRandomPrice();
        await fixture.liquidateRandomNumberOfTroves(price);

        for (let i = 0; i < randomUsers.length; ++i) {
          const user = randomUsers[i];
          const givety = randomLiquities[i];

          const x = Math.random();

          if (x < 0.5) {
            const trove = await givety.getTrove();

            if (trove.isEmpty) {
              await fixture.openRandomTrove(user.address, givety);
            } else {
              if (x < 0.4) {
                await fixture.randomlyAdjustTrove(user.address, givety, trove);
              } else {
                await fixture.closeTrove(user.address, givety, trove);
              }
            }
          } else if (x < 0.7) {
            const deposit = await givety.getStabilityDeposit();

            if (deposit.initialGUSD.isZero || x < 0.6) {
              await fixture.depositRandomAmountInStabilityPool(user.address, givety);
            } else {
              await fixture.withdrawRandomAmountFromStabilityPool(user.address, givety, deposit);
            }
          } else if (x < 0.9) {
            const stake = await givety.getGVTYStake();

            if (stake.stakedGVTY.isZero || x < 0.8) {
              await fixture.stakeRandomAmount(user.address, givety);
            } else {
              await fixture.unstakeRandomAmount(user.address, givety, stake);
            }
          } else {
            await fixture.redeemRandomAmount(user.address, givety);
          }

          // await fixture.sweepGUSD(givety);
          await fixture.sweepGVTY(givety);

          const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerGivety);
          const totalRedistributed = await deployerGivety.getTotalRedistributed();

          checkTroveOrdering(listOfTroves, totalRedistributed, price, previousListOfTroves);
          await checkPoolBalances(deployerGivety, listOfTroves, totalRedistributed);

          previousListOfTroves = listOfTroves;
        }

        if (shouldCheckSubgraph) {
          const blockNumber = await provider.getBlockNumber();
          await subgraph.waitForBlock(blockNumber);
          await checkSubgraph(subgraph, deployerGivety);
        }
      }

      fs.appendFileSync("chaos.csv", fixture.summarizeGasStats());
    }
  )

  .command(
    "order",
    "End chaos and restore order by liquidating every Trove except the Funder's.",
    {},
    async () => {
      const [deployerGivety, funderGivety] = await connectUsers([deployer, funder]);

      const initialPrice = await deployerGivety.getPrice();
      let initialNumberOfTroves = await funderGivety.getNumberOfTroves();

      let [[firstTroveOwner]] = await funderGivety.getTroves({
        first: 1,
        sortedBy: "descendingCollateralRatio"
      });

      if (firstTroveOwner !== funder.address) {
        let trove = await funderGivety.getTrove();

        if (trove.isEmpty) {
          await funderGivety.openTrove({ depositCollateral: 1000 });
          trove = await funderGivety.getTrove();
        }

        const gusdBalance = await funderGivety.getGUSDBalance();

        if (gusdBalance.lt(trove.netDebt)) {
          const [randomUser] = createRandomWallets(1, provider);
          const randomGivety = await Givety.connect(randomUser);

          const gusdNeeded = trove.netDebt.sub(gusdBalance);
          const tempTrove = {
            depositCollateral: GUSD_LIQUIDATION_RESERVE.add(gusdNeeded).div(initialPrice).mul(3),
            borrowGUSD: gusdNeeded
          };

          await funder.sendTransaction({
            to: randomUser.address,
            value: tempTrove.depositCollateral.hex
          });

          await randomGivety.openTrove(tempTrove, { gasPrice: 0 });
          initialNumberOfTroves++;
          await randomGivety.sendGUSD(funder.address, gusdNeeded, { gasPrice: 0 });
        }

        await funderGivety.repayGUSD(trove.netDebt);
      }

      [[firstTroveOwner]] = await funderGivety.getTroves({
        first: 1,
        sortedBy: "descendingCollateralRatio"
      });

      if (firstTroveOwner !== funder.address) {
        throw new Error("didn't manage to hoist Funder's Trove to head of SortedTroves");
      }

      await deployerGivety.setPrice(0.001);

      let numberOfTroves: number;
      while ((numberOfTroves = await funderGivety.getNumberOfTroves()) > 1) {
        const numberOfTrovesToLiquidate = numberOfTroves > 10 ? 10 : numberOfTroves - 1;

        console.log(`${numberOfTroves} Troves left.`);
        await funderGivety.liquidateUpTo(numberOfTrovesToLiquidate);
      }

      await deployerGivety.setPrice(initialPrice);

      if ((await funderGivety.getNumberOfTroves()) !== 1) {
        throw new Error("didn't manage to liquidate every Trove");
      }

      const funderTrove = await funderGivety.getTrove();
      const total = await funderGivety.getTotal();

      const collateralDifference = Difference.between(total.collateral, funderTrove.collateral);
      const debtDifference = Difference.between(total.debt, funderTrove.debt);

      console.log();
      console.log("Discrepancies:");
      console.log(`Collateral: ${collateralDifference}`);
      console.log(`Debt: ${debtDifference}`);
    }
  )

  .command("check-sorting", "Check if Troves are sorted by ICR.", {}, async () => {
    const deployerGivety = await Givety.connect(deployer);
    const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerGivety);
    const totalRedistributed = await deployerGivety.getTotalRedistributed();
    const price = await deployerGivety.getPrice();

    checkTroveOrdering(listOfTroves, totalRedistributed, price);

    console.log("All Troves are sorted.");
  })

  .command("check-subgraph", "Check that subgraph data matches layer 1.", {}, async () => {
    const deployerGivety = await Givety.connect(deployer);

    await checkSubgraph(subgraph, deployerGivety);

    console.log("Subgraph looks fine.");
  })

  .command("dump-troves", "Dump list of Troves.", {}, async () => {
    const deployerGivety = await Givety.connect(deployer);
    const listOfTroves = await getListOfTrovesBeforeRedistribution(deployerGivety);
    const totalRedistributed = await deployerGivety.getTotalRedistributed();
    const price = await deployerGivety.getPrice();

    dumpTroves(listOfTroves, totalRedistributed, price);
  })

  .demandCommand()
  .wrap(null)
  .parse();
