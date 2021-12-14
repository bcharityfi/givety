<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [FailedReceipt](./lib-base.failedreceipt.md)

## FailedReceipt type

Indicates that the transaction has been mined, but it failed.

<b>Signature:</b>

```typescript
export declare type FailedReceipt<R = unknown> = {
    status: "failed";
    rawReceipt: R;
};
```

## Remarks

The `rawReceipt` property is an implementation-specific transaction receipt object.

Returned by [SentGivetyTransaction.getReceipt()](./lib-base.sentgivetytransaction.getreceipt.md) and [SentGivetyTransaction.waitForReceipt()](./lib-base.sentgivetytransaction.waitforreceipt.md)<!-- -->.
