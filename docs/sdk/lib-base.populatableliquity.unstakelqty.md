<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [PopulatableGivety](./lib-base.populatablegivety.md) &gt; [unstakeGVTY](./lib-base.populatablegivety.unstakegvty.md)

## PopulatableGivety.unstakeGVTY() method

Withdraw GVTY from staking.

<b>Signature:</b>

```typescript
unstakeGVTY(amount: Decimalish): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GVTY to withdraw. |

<b>Returns:</b>

Promise&lt;[PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;P, [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, void&gt;&gt;&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out the GVTY stake's [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md)<!-- -->.

