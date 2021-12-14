import React from "react";
import { Button } from "theme-ui";

import { useGivety } from "../../../hooks/GivetyContext";
import { useTransactionFunction } from "../../Transaction";

type ClaimRewardsProps = {
  disabled?: boolean;
};

export const ClaimRewards: React.FC<ClaimRewardsProps> = ({ disabled, children }) => {
  const { givety } = useGivety();

  const [sendTransaction] = useTransactionFunction(
    "stability-deposit",
    givety.send.withdrawGainsFromStabilityPool.bind(givety.send)
  );

  return (
    <Button onClick={sendTransaction} disabled={disabled}>
      {children}
    </Button>
  );
};
