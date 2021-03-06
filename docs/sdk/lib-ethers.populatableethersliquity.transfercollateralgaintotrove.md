<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@givety/lib-ethers](./lib-ethers.md) &gt; [PopulatableEthersGivety](./lib-ethers.populatableethersgivety.md) &gt; [transferCollateralGainToTrove](./lib-ethers.populatableethersgivety.transfercollateralgaintotrove.md)

## PopulatableEthersGivety.transferCollateralGainToTrove() method

Transfer [collateral gain](./lib-base.stabilitydeposit.collateralgain.md) from Stability Deposit to Trove.

<b>Signature:</b>

```typescript
transferCollateralGainToTrove(overrides?: EthersTransactionOverrides): Promise<PopulatedEthersGivetyTransaction<CollateralGainTransferDetails>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  overrides | [EthersTransactionOverrides](./lib-ethers.etherstransactionoverrides.md) |  |

<b>Returns:</b>

Promise&lt;[PopulatedEthersGivetyTransaction](./lib-ethers.populatedethersgivetytransaction.md)<!-- -->&lt;[CollateralGainTransferDetails](./lib-base.collateralgaintransferdetails.md)<!-- -->&gt;&gt;

## Remarks

The collateral gain is transfered to the Trove as additional collateral.

As a side-effect, the transaction will also pay out the Stability Deposit's [GVTY reward](./lib-base.stabilitydeposit.gvtyreward.md)<!-- -->.

