<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [PopulatableGivety](./lib-base.populatablegivety.md) &gt; [withdrawGUSDFromStabilityPool](./lib-base.populatablegivety.withdrawgusdfromstabilitypool.md)

## PopulatableGivety.withdrawGUSDFromStabilityPool() method

Withdraw GUSD from Stability Deposit.

<b>Signature:</b>

```typescript
withdrawGUSDFromStabilityPool(amount: Decimalish): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, StabilityDepositChangeDetails>>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GUSD to withdraw. |

<b>Returns:</b>

Promise&lt;[PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;P, [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, [StabilityDepositChangeDetails](./lib-base.stabilitydepositchangedetails.md)<!-- -->&gt;&gt;&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out the Stability Deposit's [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) and [GVTY reward](./lib-base.stabilitydeposit.gvtyreward.md)<!-- -->.

