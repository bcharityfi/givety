<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [liquidateUpTo](./lib-ethers.sendableethersgivety.liquidateupto.md)

## SendableEthersGivety.liquidateUpTo() method

Liquidate the least collateralized Troves up to a maximum number.

<b>Signature:</b>

```typescript
liquidateUpTo(maximumNumberOfTrovesToLiquidate: number, overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<LiquidationDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  maximumNumberOfTrovesToLiquidate | number | Stop after liquidating this many Troves. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;[LiquidationDetails](./lib-base.liquidationdetails.md)<!-- -->&gt;&gt;

