import { Button } from "theme-ui";

import { Decimal } from "givety-lib-base";

import { useGivety } from "../../hooks/GivetyContext";
import { useTransactionFunction } from "../Transaction";

type RedemptionActionProps = {
  transactionId: string;
  disabled?: boolean;
  gusdAmount: Decimal;
  maxRedemptionRate: Decimal;
};

export const RedemptionAction: React.FC<RedemptionActionProps> = ({
  transactionId,
  disabled,
  gusdAmount,
  maxRedemptionRate
}) => {
  const {
    givety: { send: givety }
  } = useGivety();

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    givety.redeemGUSD.bind(givety, gusdAmount, maxRedemptionRate)
  );

  return (
    <Button disabled={disabled} onClick={sendTransaction}>
      Confirm
    </Button>
  );
};
