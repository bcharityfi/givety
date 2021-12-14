<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [closeTrove](./lib-ethers.sendableethersgivety.closetrove.md)

## SendableEthersGivety.closeTrove() method

Close existing Trove by repaying all debt and withdrawing all collateral.

<b>Signature:</b>

```typescript
closeTrove(overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<TroveClosureDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;[TroveClosureDetails](./lib-base.troveclosuredetails.md)<!-- -->&gt;&gt;
