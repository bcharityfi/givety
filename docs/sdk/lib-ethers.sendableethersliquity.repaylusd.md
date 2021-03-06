<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [repayGUSD](./lib-ethers.sendableethersgivety.repaygusd.md)

## SendableEthersGivety.repayGUSD() method

Adjust existing Trove by repaying some of its debt.

<b>Signature:</b>

```typescript
repayGUSD(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<TroveAdjustmentDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | The amount of GUSD to repay. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;[TroveAdjustmentDetails](./lib-base.troveadjustmentdetails.md)<!-- -->&gt;&gt;

## Remarks

Equivalent to:

```typescript
adjustTrove({ repayGUSD: amount })

```

