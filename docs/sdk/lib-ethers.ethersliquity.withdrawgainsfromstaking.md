<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [withdrawGainsFromStaking](./lib-ethers.ethersgivety.withdrawgainsfromstaking.md)

## EthersGivety.withdrawGainsFromStaking() method

Withdraw [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md) from GVTY stake.

<b>Signature:</b>

```typescript
withdrawGainsFromStaking(overrides?: EthersTransactionOverrides): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;void&gt;

## Exceptions

Throws [EthersTransactionFailedError](./lib-ethers.etherstransactionfailederror.md) in case of transaction failure. Throws [EthersTransactionCancelledError](./lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.
