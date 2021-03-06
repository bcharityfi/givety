<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [getTotalRedistributed](./lib-ethers.ethersgivety.gettotalredistributed.md)

## EthersGivety.getTotalRedistributed() method

Get the total collateral and debt per stake that has been liquidated through redistribution.

<b>Signature:</b>

```typescript
getTotalRedistributed(overrides?: EthersCallOverrides): Promise<Trove>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  overrides | [EthersCallOverrides](./lib-ethers.etherscalloverrides.md) |  |

<b>Returns:</b>

Promise&lt;[Trove](./lib-base.trove.md)<!-- -->&gt;

## Remarks

Needed when dealing with instances of [TroveWithPendingRedistribution](./lib-base.trovewithpendingredistribution.md)<!-- -->.

