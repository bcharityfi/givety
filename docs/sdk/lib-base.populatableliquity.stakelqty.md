<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [PopulatableGivety](./lib-base.populatablegivety.md) &gt; [stakeGVTY](./lib-base.populatablegivety.stakegvty.md)

## PopulatableGivety.stakeGVTY() method

Stake GVTY to start earning fee revenue or increase existing stake.

<b>Signature:</b>

```typescript
stakeGVTY(amount: Decimalish): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GVTY to add to new or existing stake. |

<b>Returns:</b>

Promise&lt;[PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;P, [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, void&gt;&gt;&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out an existing GVTY stake's [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md)<!-- -->.

