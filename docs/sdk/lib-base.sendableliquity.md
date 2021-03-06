<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [SendableGivety](./lib-base.sendablegivety.md)

## SendableGivety interface

Send Givety transactions.

<b>Signature:</b>

```typescript
export interface SendableGivety<R = unknown, S = unknown> extends _SendableFrom<TransactableGivety, R, S> 
```
<b>Extends:</b> \_SendableFrom&lt;[TransactableGivety](./lib-base.transactablegivety.md)<!-- -->, R, S&gt;

## Remarks

The functions return an object implementing [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->, which can be used to monitor the transaction and get its details when it succeeds.

Implemented by [SendableEthersGivety](./lib-ethers.sendableethersgivety.md)<!-- -->.

## Methods

|  Method | Description |
|  --- | --- |
|  [adjustTrove(params, maxBorrowingRate)](./lib-base.sendablegivety.adjusttrove.md) | Adjust existing Trove by changing its collateral, debt, or both. |
|  [approveGivTokens(allowance)](./lib-base.sendablegivety.approveunitokens.md) | Allow the liquidity mining contract to use GiveSwap GIVE/GUSD LP tokens for [staking](./lib-base.transactablegivety.stakeunitokens.md)<!-- -->. |
|  [borrowGUSD(amount, maxBorrowingRate)](./lib-base.sendablegivety.borrowgusd.md) | Adjust existing Trove by borrowing more GUSD. |
|  [claimCollateralSurplus()](./lib-base.sendablegivety.claimcollateralsurplus.md) | Claim leftover collateral after a liquidation or redemption. |
|  [closeTrove()](./lib-base.sendablegivety.closetrove.md) | Close existing Trove by repaying all debt and withdrawing all collateral. |
|  [depositCollateral(amount)](./lib-base.sendablegivety.depositcollateral.md) | Adjust existing Trove by depositing more collateral. |
|  [depositGUSDInStabilityPool(amount, frontendTag)](./lib-base.sendablegivety.depositgusdinstabilitypool.md) | Make a new Stability Deposit, or top up existing one. |
|  [exitLiquidityMining()](./lib-base.sendablegivety.exitliquiditymining.md) | Withdraw all staked LP tokens from liquidity mining and claim reward. |
|  [liquidate(address)](./lib-base.sendablegivety.liquidate.md) | Liquidate one or more undercollateralized Troves. |
|  [liquidateUpTo(maximumNumberOfTrovesToLiquidate)](./lib-base.sendablegivety.liquidateupto.md) | Liquidate the least collateralized Troves up to a maximum number. |
|  [openTrove(params, maxBorrowingRate)](./lib-base.sendablegivety.opentrove.md) | Open a new Trove by depositing collateral and borrowing GUSD. |
|  [redeemGUSD(amount, maxRedemptionRate)](./lib-base.sendablegivety.redeemgusd.md) | Redeem GUSD to native currency (e.g. Give) at face value. |
|  [registerFrontend(kickbackRate)](./lib-base.sendablegivety.registerfrontend.md) | Register current wallet address as a Givety frontend. |
|  [repayGUSD(amount)](./lib-base.sendablegivety.repaygusd.md) | Adjust existing Trove by repaying some of its debt. |
|  [sendGVTY(toAddress, amount)](./lib-base.sendablegivety.sendgvty.md) | Send GVTY tokens to an address. |
|  [sendGUSD(toAddress, amount)](./lib-base.sendablegivety.sendgusd.md) | Send GUSD tokens to an address. |
|  [stakeGVTY(amount)](./lib-base.sendablegivety.stakegvty.md) | Stake GVTY to start earning fee revenue or increase existing stake. |
|  [stakeGivTokens(amount)](./lib-base.sendablegivety.stakeunitokens.md) | Stake GiveSwap GIVE/GUSD LP tokens to participate in liquidity mining and earn GVTY. |
|  [transferCollateralGainToTrove()](./lib-base.sendablegivety.transfercollateralgaintotrove.md) | Transfer [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) from Stability Deposit to Trove. |
|  [unstakeGVTY(amount)](./lib-base.sendablegivety.unstakegvty.md) | Withdraw GVTY from staking. |
|  [unstakeGivTokens(amount)](./lib-base.sendablegivety.unstakeunitokens.md) | Withdraw GiveSwap GIVE/GUSD LP tokens from liquidity mining. |
|  [withdrawCollateral(amount)](./lib-base.sendablegivety.withdrawcollateral.md) | Adjust existing Trove by withdrawing some of its collateral. |
|  [withdrawGainsFromStabilityPool()](./lib-base.sendablegivety.withdrawgainsfromstabilitypool.md) | Withdraw [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) and [GVTY reward](./lib-base.stabilitydeposit.gvtyreward.md) from Stability Deposit. |
|  [withdrawGainsFromStaking()](./lib-base.sendablegivety.withdrawgainsfromstaking.md) | Withdraw [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md) from GVTY stake. |
|  [withdrawGVTYRewardFromLiquidityMining()](./lib-base.sendablegivety.withdrawgvtyrewardfromliquiditymining.md) | Withdraw GVTY that has been earned by mining liquidity. |
|  [withdrawGUSDFromStabilityPool(amount)](./lib-base.sendablegivety.withdrawgusdfromstabilitypool.md) | Withdraw GUSD from Stability Deposit. |

