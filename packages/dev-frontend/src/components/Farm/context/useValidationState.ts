import { Decimal, GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

const selector = ({
  givTokenBalance,
  givTokenAllowance,
  liquidityMiningStake
}: GivetyStoreState) => ({
  givTokenBalance,
  givTokenAllowance,
  liquidityMiningStake
});

type FarmStakeValidation = {
  isValid: boolean;
  hasApproved: boolean;
  hasEnoughGivToken: boolean;
  isWithdrawing: boolean;
  amountChanged: Decimal;
  maximumStake: Decimal;
  hasSetMaximumStake: boolean;
};

export const useValidationState = (amount: Decimal): FarmStakeValidation => {
  const { givTokenBalance, givTokenAllowance, liquidityMiningStake } = useGivetySelector(selector);
  const isWithdrawing = liquidityMiningStake.gt(amount);
  const amountChanged = isWithdrawing
    ? liquidityMiningStake.sub(amount)
    : Decimal.from(amount).sub(liquidityMiningStake);
  const maximumStake = liquidityMiningStake.add(givTokenBalance);
  const hasSetMaximumStake = amount.eq(maximumStake);

  if (isWithdrawing) {
    return {
      isValid: true,
      hasApproved: true,
      hasEnoughGivToken: true,
      isWithdrawing,
      amountChanged,
      maximumStake,
      hasSetMaximumStake
    };
  }

  const hasApproved = !givTokenAllowance.isZero && givTokenAllowance.gte(amountChanged);
  const hasEnoughGivToken = !givTokenBalance.isZero && givTokenBalance.gte(amountChanged);

  return {
    isValid: hasApproved && hasEnoughGivToken,
    hasApproved,
    hasEnoughGivToken,
    isWithdrawing,
    amountChanged,
    maximumStake,
    hasSetMaximumStake
  };
};
