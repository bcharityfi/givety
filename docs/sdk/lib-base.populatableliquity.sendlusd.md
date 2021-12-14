<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [PopulatableGivety](./lib-base.populatablegivety.md) &gt; [sendGUSD](./lib-base.populatablegivety.sendgusd.md)

## PopulatableGivety.sendGUSD() method

Send GUSD tokens to an address.

<b>Signature:</b>

```typescript
sendGUSD(toAddress: string, amount: Decimalish): Promise<PopulatedGivetyTransaction<P, SentGivetyTransaction<S, GivetyReceipt<R, void>>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  toAddress | string | Address of receipient. |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GUSD to send. |

<b>Returns:</b>

Promise&lt;[PopulatedGivetyTransaction](./lib-base.populatedgivetytransaction.md)<!-- -->&lt;P, [SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, void&gt;&gt;&gt;&gt;
