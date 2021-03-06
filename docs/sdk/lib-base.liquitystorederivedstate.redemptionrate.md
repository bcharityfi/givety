<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [givety-lib-base](./lib-base.md) &gt; [GivetyStoreDerivedState](./lib-base.givetystorederivedstate.md) &gt; [redemptionRate](./lib-base.givetystorederivedstate.redemptionrate.md)

## GivetyStoreDerivedState.redemptionRate property

Current redemption rate.

<b>Signature:</b>

```typescript
redemptionRate: Decimal;
```

## Remarks

Note that the actual rate paid by a redemption transaction will depend on the amount of GUSD being redeemed.

Use [Fees.redemptionRate()](./lib-base.fees.redemptionrate.md) to calculate a precise redemption rate.

