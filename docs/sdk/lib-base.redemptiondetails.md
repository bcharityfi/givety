<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [RedemptionDetails](./lib-base.redemptiondetails.md)

## RedemptionDetails interface

Details of a [redeemGUSD()](./lib-base.transactablegivety.redeemgusd.md) transaction.

<b>Signature:</b>

```typescript
export interface RedemptionDetails 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [actualGUSDAmount](./lib-base.redemptiondetails.actualgusdamount.md) | [Decimal](./lib-base.decimal.md) | Amount of GUSD that was actually redeemed by the transaction. |
|  [attemptedGUSDAmount](./lib-base.redemptiondetails.attemptedgusdamount.md) | [Decimal](./lib-base.decimal.md) | Amount of GUSD the redeemer tried to redeem. |
|  [collateralTaken](./lib-base.redemptiondetails.collateraltaken.md) | [Decimal](./lib-base.decimal.md) | Amount of collateral (e.g. Give) taken from Troves by the transaction. |
|  [fee](./lib-base.redemptiondetails.fee.md) | [Decimal](./lib-base.decimal.md) | Amount of native currency (e.g. Give) deducted as fee from collateral taken. |

