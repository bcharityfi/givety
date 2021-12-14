import React, { useEffect } from "react";
import { Button } from "theme-ui";
import { Decimal } from "givety-lib-base";
import { useGivety } from "../../../hooks/GivetyContext";
import { Transaction, useMyTransactionState } from "../../Transaction";
import { useValidationState } from "../context/useValidationState";
import { useFarmView } from "../context/FarmViewContext";

type ConfirmProps = {
  amount: Decimal;
};

const transactionId = "farm-confirm";

export const Confirm: React.FC<ConfirmProps> = ({ amount }) => {
  const { dispatchEvent } = useFarmView();
  const {
    givety: { send: givety }
  } = useGivety();

  const transactionState = useMyTransactionState(transactionId);
  const { isValid, isWithdrawing, amountChanged } = useValidationState(amount);

  const transactionAction = isWithdrawing
    ? givety.unstakeGivTokens.bind(givety, amountChanged)
    : givety.stakeGivTokens.bind(givety, amountChanged);

  const shouldDisable = amountChanged.isZero || !isValid;

  useEffect(() => {
    if (transactionState.type === "confirmedOneShot") {
      dispatchEvent("STAKE_CONFIRMED");
    }
  }, [transactionState.type, dispatchEvent]);

  return (
    <Transaction
      id={transactionId}
      send={transactionAction}
      showFailure="asTooltip"
      tooltipPlacement="bottom"
    >
      <Button disabled={shouldDisable}>Confirm</Button>
    </Transaction>
  );
};
