<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md) &gt; [waitForReceipt](./lib-ethers.sentethersgivetytransaction.waitforreceipt.md)

## SentEthersGivetyTransaction.waitForReceipt() method

Wait for the transaction to be mined, and check whether it was successful.

<b>Signature:</b>

```typescript
waitForReceipt(): Promise<MinedReceipt<EthersTransactionReceipt, T>>;
```
<b>Returns:</b>

Promise&lt;[MinedReceipt](./lib-base.minedreceipt.md)<!-- -->&lt;[EthersTransactionReceipt](./lib-ethers.etherstransactionreceipt.md)<!-- -->, T&gt;&gt;

Either a [FailedReceipt](./lib-base.failedreceipt.md) or a [SuccessfulReceipt](./lib-base.successfulreceipt.md)<!-- -->.

## Exceptions

Throws [EthersTransactionCancelledError](./lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.

