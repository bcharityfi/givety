import React, { useEffect } from "react";
import { Button } from "theme-ui";
import { useGivety } from "../../../hooks/GivetyContext";
import { Transaction, useMyTransactionState } from "../../Transaction";
import { useFarmView } from "../context/FarmViewContext";

const transactionId = "farm-unstake-and-claim";

export const UnstakeAndClaim: React.FC = () => {
  const { dispatchEvent } = useFarmView();

  const {
    givety: { send: givety }
  } = useGivety();

  const transactionState = useMyTransactionState(transactionId);

  useEffect(() => {
    if (transactionState.type === "confirmedOneShot") {
      dispatchEvent("UNSTAKE_AND_CLAIM_CONFIRMED");
    }
  }, [transactionState.type, dispatchEvent]);

  return (
    <Transaction
      id={transactionId}
      send={givety.exitLiquidityMining.bind(givety)}
      showFailure="asTooltip"
      tooltipPlacement="bottom"
    >
      <Button variant="outline" sx={{ mt: 3, width: "100%" }}>
        Unstake and claim reward
      </Button>
    </Transaction>
  );
};
