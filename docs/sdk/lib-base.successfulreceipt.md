<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [SuccessfulReceipt](./lib-base.successfulreceipt.md)

## SuccessfulReceipt type

Indicates that the transaction has succeeded.

<b>Signature:</b>

```typescript
export declare type SuccessfulReceipt<R = unknown, D = unknown> = {
    status: "succeeded";
    rawReceipt: R;
    details: D;
};
```

## Remarks

The `rawReceipt` property is an implementation-specific transaction receipt object.

The `details` property may contain more information about the transaction. See the return types of [TransactableGivety](./lib-base.transactablegivety.md) functions for the exact contents of `details` for each type of Givety transaction.

Returned by [SentGivetyTransaction.getReceipt()](./lib-base.sentgivetytransaction.getreceipt.md) and [SentGivetyTransaction.waitForReceipt()](./lib-base.sentgivetytransaction.waitforreceipt.md)<!-- -->.

