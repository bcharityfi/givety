<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [sendGVTY](./lib-ethers.sendableethersgivety.sendgvty.md)

## SendableEthersGivety.sendGVTY() method

Send GVTY tokens to an address.

<b>Signature:</b>

```typescript
sendGVTY(toAddress: string, amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<void>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  toAddress | string | Address of receipient. |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GVTY to send. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;void&gt;&gt;
