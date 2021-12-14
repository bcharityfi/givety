<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [stakeGivTokens](./lib-ethers.ethersgivety.stakeunitokens.md)

## EthersGivety.stakeGivTokens() method

Stake GiveSwap GIVE/GUSD LP tokens to participate in liquidity mining and earn GVTY.

<b>Signature:</b>

```typescript
stakeGivTokens(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of LP tokens to add to new or existing stake. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;void&gt;

## Exceptions

Throws [EthersTransactionFailedError](./lib-ethers.etherstransactionfailederror.md) in case of transaction failure. Throws [EthersTransactionCancelledError](./lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.
