<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [SendableEthersGivety](./lib-ethers.sendableethersgivety.md) &gt; [registerFrontend](./lib-ethers.sendableethersgivety.registerfrontend.md)

## SendableEthersGivety.registerFrontend() method

Register current wallet address as a Givety frontend.

<b>Signature:</b>

```typescript
registerFrontend(kickbackRate: Decimalish, overrides?: EthersTransactionOverrides): Promise<SentEthersGivetyTransaction<void>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  kickbackRate | [Decimalish](./lib-base.decimalish.md) | The portion of GVTY rewards to pass onto users of the frontend (between 0 and 1). |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[SentEthersGivetyTransaction](./lib-ethers.sentethersgivetytransaction.md)<!-- -->&lt;void&gt;&gt;

