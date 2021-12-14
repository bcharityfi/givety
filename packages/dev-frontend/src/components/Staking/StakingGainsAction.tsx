import { Button } from "theme-ui";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../../hooks/GivetyContext";
import { useTransactionFunction } from "../Transaction";

const selectGVTYStake = ({ gvtyStake }: GivetyStoreState) => gvtyStake;

export const StakingGainsAction: React.FC = () => {
  const { givety } = useGivety();
  const { collateralGain, gusdGain } = useGivetySelector(selectGVTYStake);

  const [sendTransaction] = useTransactionFunction(
    "stake",
    givety.send.withdrawGainsFromStaking.bind(givety.send)
  );

  return (
    <Button onClick={sendTransaction} disabled={collateralGain.isZero && gusdGain.isZero}>
      Claim gains
    </Button>
  );
};
