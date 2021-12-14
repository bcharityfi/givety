<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [getLiquidityMiningStake](./lib-ethers.ethersgivety.getliquidityminingstake.md)

## EthersGivety.getLiquidityMiningStake() method

Get the amount of GiveSwap GIVE/GUSD LP tokens currently staked by an address in liquidity mining.

<b>Signature:</b>

```typescript
getLiquidityMiningStake(address?: string, overrides?: EthersCallOverrides): Promise<Decimal>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  address | string | Address whose LP stake should be retrieved. |
|  overrides | [EthersCallOverrides](./lib-ethers.etherscalloverrides.md) |  |

<b>Returns:</b>

Promise&lt;[Decimal](./lib-base.decimal.md)<!-- -->&gt;
