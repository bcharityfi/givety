<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [PopulatableEthersGivety](./lib-ethers.populatableethersgivety.md) &gt; [stakeGVTY](./lib-ethers.populatableethersgivety.stakegvty.md)

## PopulatableEthersGivety.stakeGVTY() method

Stake GVTY to start earning fee revenue or increase existing stake.

<b>Signature:</b>

```typescript
stakeGVTY(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersGivetyTransaction<void>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GVTY to add to new or existing stake. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[PopulatedEthersGivetyTransaction](./lib-ethers.populatedethersgivetytransaction.md)<!-- -->&lt;void&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out an existing GVTY stake's [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md)<!-- -->.

