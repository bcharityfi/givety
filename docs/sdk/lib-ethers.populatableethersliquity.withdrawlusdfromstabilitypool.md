<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [PopulatableEthersGivety](./lib-ethers.populatableethersgivety.md) &gt; [withdrawGUSDFromStabilityPool](./lib-ethers.populatableethersgivety.withdrawgusdfromstabilitypool.md)

## PopulatableEthersGivety.withdrawGUSDFromStabilityPool() method

Withdraw GUSD from Stability Deposit.

<b>Signature:</b>

```typescript
withdrawGUSDFromStabilityPool(amount: Decimalish, overrides?: EthersTransactionOverrides): Promise<PopulatedEthersGivetyTransaction<StabilityDepositChangeDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  amount | [Decimalish](./lib-base.decimalish.md) | Amount of GUSD to withdraw. |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[PopulatedEthersGivetyTransaction](./lib-ethers.populatedethersgivetytransaction.md)<!-- -->&lt;[StabilityDepositChangeDetails](./lib-base.stabilitydepositchangedetails.md)<!-- -->&gt;&gt;

## Remarks

As a side-effect, the transaction will also pay out the Stability Deposit's [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) and [GVTY reward](./lib-base.stabilitydeposit.gvtyreward.md)<!-- -->.
