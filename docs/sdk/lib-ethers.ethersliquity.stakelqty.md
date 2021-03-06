<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [stakeGVTY](./lib-ethers.ethersgivety.stakegvty.md)

## EthersGivety.stakeGVTY() method

Stake GVTY to start earning fee revenue or increase existing stake.

<b>Signature:</b>

```typescript
stakeGVTY(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GVTY to add to new or existing stake. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;void&gt;

## Exceptions

Throws [EthersTransactionFailedError](./lib-ethers.etherstransactionfailederror.md) in case of transaction failure. Throws [EthersTransactionCancelledError](./lib-ethers.etherstransactioncancellederror.md) if the transaction is cancelled or replaced.

## Remarks

As a side-effect, the transaction will also pay out an existing GVTY stake's [collateral gain](./lib-base.gvtystake.collateralgain.md) and [GUSD gain](./lib-base.gvtystake.gusdgain.md)<!-- -->.

