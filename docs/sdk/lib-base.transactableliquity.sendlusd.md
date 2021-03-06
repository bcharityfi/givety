<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [TransactableGivety](./lib-base.transactablegivety.md) &gt; [sendGUSD](./lib-base.transactablegivety.sendgusd.md)

## TransactableGivety.sendGUSD() method

Send GUSD tokens to an address.

<b>Signature:</b>

```typescript
sendGUSD(toAddress: string, amount: Decimalish): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  toAddress | string | Address of receipient. |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GUSD to send. |

<b>Returns:</b>

Promise&lt;void&gt;

## Exceptions

Throws [TransactionFailedError](./lib-base.transactionfailederror.md) in case of transaction failure.

