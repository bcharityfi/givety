<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [SendableGivety](./lib-base.sendablegivety.md) &gt; [sendGUSD](./lib-base.sendablegivety.sendgusd.md)

## SendableGivety.sendGUSD() method

Send GUSD tokens to an address.

<b>Signature:</b>

```typescript
sendGUSD(toAddress: string, amount: Decimalish): Promise<SentGivetyTransaction<S, GivetyReceipt<R, void>>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  toAddress | string | Address of receipient. |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GUSD to send. |

<b>Returns:</b>

Promise&lt;[SentGivetyTransaction](./lib-base.sentgivetytransaction.md)<!-- -->&lt;S, [GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;R, void&gt;&gt;&gt;

