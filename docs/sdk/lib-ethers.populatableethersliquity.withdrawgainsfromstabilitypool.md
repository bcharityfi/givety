<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [PopulatableEthersGivety](./lib-ethers.populatableethersgivety.md) &gt; [withdrawGainsFromStabilityPool](./lib-ethers.populatableethersgivety.withdrawgainsfromstabilitypool.md)

## PopulatableEthersGivety.withdrawGainsFromStabilityPool() method

Withdraw [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) and [GVTY reward](./lib-base.stabilitydeposit.gvtyreward.md) from Stability Deposit.

<b>Signature:</b>

```typescript
withdrawGainsFromStabilityPool(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersGivetyTransaction<StabilityPoolGainsWithdrawalDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[PopulatedEthersGivetyTransaction](./lib-ethers.populatedethersgivetytransaction.md)<!-- -->&lt;[StabilityPoolGainsWithdrawalDetails](./lib-base.stabilitypoolgainswithdrawaldetails.md)<!-- -->&gt;&gt;
