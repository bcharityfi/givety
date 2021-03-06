<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [TransactableGivety](./lib-base.transactablegivety.md) &gt; [repayGUSD](./lib-base.transactablegivety.repaygusd.md)

## TransactableGivety.repayGUSD() method

Adjust existing Trove by repaying some of its debt.

<b>Signature:</b>

```typescript
repayGUSD(amount: Decimalish): Promise<TroveAdjustmentDetails>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | The amount of GUSD to repay. |

<b>Returns:</b>

Promise&lt;[TroveAdjustmentDetails](./lib-base.troveadjustmentdetails.md)<!-- -->&gt;

## Exceptions

Throws [TransactionFailedError](./lib-base.transactionfailederror.md) in case of transaction failure.

## Remarks

Equivalent to:

```typescript
adjustTrove({ repayGUSD: amount })

```

