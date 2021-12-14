import { Button } from "theme-ui";

import { Decimal, TroveChange } from "givety-lib-base";

import { useGivety } from "../../hooks/GivetyContext";
import { useTransactionFunction } from "../Transaction";

type TroveActionProps = {
  transactionId: string;
  change: Exclude<TroveChange<Decimal>, { type: "invalidCreation" }>;
  maxBorrowingRate: Decimal;
  borrowingFeeDecayToleranceMinutes: number;
};

export const TroveAction: React.FC<TroveActionProps> = ({
  children,
  transactionId,
  change,
  maxBorrowingRate,
  borrowingFeeDecayToleranceMinutes
}) => {
  const { givety } = useGivety();

  const [sendTransaction] = useTransactionFunction(
    transactionId,
    change.type === "creation"
      ? givety.send.openTrove.bind(givety.send, change.params, {
          maxBorrowingRate,
          borrowingFeeDecayToleranceMinutes
        })
      : change.type === "closure"
      ? givety.send.closeTrove.bind(givety.send)
      : givety.send.adjustTrove.bind(givety.send, change.params, {
          maxBorrowingRate,
          borrowingFeeDecayToleranceMinutes
        })
  );

  return <Button onClick={sendTransaction}>{children}</Button>;
};
