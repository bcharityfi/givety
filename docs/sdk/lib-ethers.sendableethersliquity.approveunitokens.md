<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [approveGivTokens](./lib-ethers.sendableethersgivety.approveunitokens.md)

## SendableEthersGivety.approveGivTokens() method

Allow the liquidity mining contract to use GiveSwap GIVE/GUSD LP tokens for [staking](./lib-base.transactablegivety.stakeunitokens.md)<!-- -->.

<b>Signature:</b>

```typescript
approveGivTokens(allowance?: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<void>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  allowance | [Decimalish](./lib-base.decimalish.md) | Maximum amount of LP tokens that will be transferrable to liquidity mining (<code>2^256 - 1</code> by default). |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;void&gt;&gt;

## Remarks

Must be performed before calling [stakeGivTokens()](./lib-base.transactablegivety.stakeunitokens.md)<!-- -->.
