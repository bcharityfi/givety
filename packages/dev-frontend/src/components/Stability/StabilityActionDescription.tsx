import React from "react";

import { Decimal, StabilityDeposit, StabilityDepositChange } from "givety-lib-base";

import { COIN, GT } from "../../strings";
import { ActionDescription, Amount } from "../ActionDescription";

type StabilityActionDescriptionProps = {
  originalDeposit: StabilityDeposit;
  change: StabilityDepositChange<Decimal>;
};

export const StabilityActionDescription: React.FC<StabilityActionDescriptionProps> = ({
  originalDeposit,
  change
}) => {
  const collateralGain = originalDeposit.collateralGain.nonZero?.prettify(4).concat(" GIVE");
  const gvtyReward = originalDeposit.gvtyReward.nonZero?.prettify().concat(" ", GT);

  return (
    <ActionDescription>
      {change.depositGUSD ? (
        <>
          You are depositing{" "}
          <Amount>
            {change.depositGUSD.prettify()} {COIN}
          </Amount>{" "}
          in the Stability Pool
        </>
      ) : (
        <>
          You are withdrawing{" "}
          <Amount>
            {change.withdrawGUSD.prettify()} {COIN}
          </Amount>{" "}
          to your wallet
        </>
      )}
      {(collateralGain || gvtyReward) && (
        <>
          {" "}
          and claiming at least{" "}
          {collateralGain && gvtyReward ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{gvtyReward}</Amount>
            </>
          ) : (
            <Amount>{collateralGain ?? gvtyReward}</Amount>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};
