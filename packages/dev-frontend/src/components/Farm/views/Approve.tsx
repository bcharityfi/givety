import React, { useEffect } from "react";
import { Button } from "theme-ui";
import { Decimal } from "givety-lib-base";
import { useGivety } from "../../../hooks/GivetyContext";
import { Transaction, useMyTransactionState } from "../../Transaction";
import { useFarmView } from "../context/FarmViewContext";
import { useValidationState } from "../context/useValidationState";

type ApproveProps = {
  amount: Decimal;
};

const transactionId = "farm-approve";

export const Approve: React.FC<ApproveProps> = ({ amount }) => {
  const { dispatchEvent } = useFarmView();
  const {
    givety: { send: givety }
  } = useGivety();

  const { hasApproved } = useValidationState(amount);
  const transactionState = useMyTransactionState(transactionId);

  useEffect(() => {
    if (transactionState.type === "confirmedOneShot") {
      dispatchEvent("STAKE_APPROVED");
    }
  }, [transactionState.type, dispatchEvent]);

  if (hasApproved) {
    return null;
  }

  return (
    <Transaction
      id={transactionId}
      send={givety.approveGivTokens.bind(givety, undefined)}
      showFailure="asTooltip"
      tooltipPlacement="bottom"
    >
      <Button sx={{ width: "60%" }}>Approve UNI LP</Button>
    </Transaction>
  );
};
