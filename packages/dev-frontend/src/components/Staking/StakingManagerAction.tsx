import { Button } from "theme-ui";

import { Decimal, GVTYStakeChange } from "givety-lib-base";

import { useGivety } from "../../hooks/GivetyContext";
import { useTransactionFunction } from "../Transaction";

type StakingActionProps = {
  change: GVTYStakeChange<Decimal>;
};

export const StakingManagerAction: React.FC<StakingActionProps> = ({ change, children }) => {
  const { givety } = useGivety();

  const [sendTransaction] = useTransactionFunction(
    "stake",
    change.stakeGVTY
      ? givety.send.stakeGVTY.bind(givety.send, change.stakeGVTY)
      : givety.send.unstakeGVTY.bind(givety.send, change.unstakeGVTY)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
