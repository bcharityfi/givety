<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [EthersGivety](./lib-ethers.ethersgivety.md) &gt; [getFrontendStatus](./lib-ethers.ethersgivety.getfrontendstatus.md)

## EthersGivety.getFrontendStatus() method

Check whether an address is registered as a Givety frontend, and what its kickback rate is.

<b>Signature:</b>

```typescript
getFrontendStatus(address?: string, overrides?: EthersCallOverrides): Promise<FrontendStatus>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  address | string | Address to check. |
|  overrides | [EthersCallOverrides](./lib-ethers.etherscalloverrides.md) |  |

<b>Returns:</b>

Promise&lt;[FrontendStatus](./lib-base.frontendstatus.md)<!-- -->&gt;
