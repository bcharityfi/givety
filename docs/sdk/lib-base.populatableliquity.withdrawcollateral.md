<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [PopulatableGivety](./lib-base.populatablegivety.md) &gt; [withdrawCollateral](./lib-base.populatablegivety.withdrawcollateral.md)

## PopulatableGivety.withdrawCollateral() method

Adjust existing Trove by withdrawing some of its collateral.

<b>Signature:</b>

```typescript
withdrawCollateral(amount: Decimalish): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, TroveAdjustmentDetails>>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | The amount of collateral to withdraw from the Trove. |

<b>Returns:</b>

Promise&lt;[PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;P, [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, [TroveAdjustmentDetails](./lib-base.troveadjustmentdetails.md)<!-- -->&gt;&gt;&gt;&gt;

## Remarks

Equivalent to:

```typescript
adjustTrove({ withdrawCollateral: amount })

```

