import { Button } from "theme-ui";
import { Decimal, GivetyStoreState, StabilityDepositChange } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../../hooks/GivetyContext";
import { useTransactionFunction } from "../Transaction";

type StabilityDepositActionProps = {
  transactionId: string;
  change: StabilityDepositChange<Decimal>;
};

const selectFrontendRegistered = ({ frontend }: GivetyStoreState) =>
  frontend.status === "registered";

export const StabilityDepositAction: React.FC<StabilityDepositActionProps> = ({
  children,
  transactionId,
  change
}) => {
  const { config, givety } = useGivety();
  const frontendRegistered = useGivetySelector(selectFrontendRegistered);

  const frontendTag = frontendRegistered ? config.frontendTag : undefined;

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.depositGUSD
      ? givety.send.depositGUSDInStabilityPool.bind(givety.send, change.depositGUSD, frontendTag)
      : givety.send.withdrawGUSDFromStabilityPool.bind(givety.send, change.withdrawGUSD)
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
