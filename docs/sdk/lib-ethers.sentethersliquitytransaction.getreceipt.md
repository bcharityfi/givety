<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md) &gt; [getReceipt](./lib-ethers.sentethersgivetytransaction.getreceipt.md)

## SentEthersGivetyTransaction.getReceipt() method

Check whether the transaction has been mined, and whether it was successful.

<b>Signature:</b>

```typescript
getReceipt(): Promise<GivetyReceipt<EthersTransactionReceipt, T>>;
```
<b>Returns:</b>

Promise&lt;[GivetyReceipt](./lib-base.givetyreceipt.md)<!-- -->&lt;[EthersTransactionReceipt](./lib-ethers.etherstransactionreceipt.md)<!-- -->, T&gt;&gt;

## Remarks

Unlike [waitForReceipt()](./lib-base.sentgivetytransaction.waitforreceipt.md)<!-- -->, this function doesn't wait for the transaction to be mined.
