import React, { useEffect } from "react";
import { Button, Flex, Spinner } from "theme-ui";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../hooks/GivetyContext";

import { Transaction, useMyTransactionState } from "./Transaction";
import { useTroveView } from "./Trove/context/TroveViewContext";

const select = ({ collateralSurplusBalance }: GivetyStoreState) => ({
  collateralSurplusBalance
});

export const CollateralSurplusAction: React.FC = () => {
  const { collateralSurplusBalance } = useGivetySelector(select);
  const {
    givety: { send: givety }
  } = useGivety();

  const myTransactionId = "claim-coll-surplus";
  const myTransactionState = useMyTransactionState(myTransactionId);

  const { dispatchEvent } = useTroveView();

  useEffect(() => {
    if (myTransactionState.type === "confirmedOneShot") {
      dispatchEvent("TROVE_SURPLUS_COLLATERAL_CLAIMED");
    }
  }, [myTransactionState.type, dispatchEvent]);

  return myTransactionState.type === "waitingForApproval" ? (
    <Flex variant="layout.actions">
      <Button disabled sx={{ mx: 2 }}>
        <Spinner sx={{ mr: 2, color: "white" }} size="20px" />
        Waiting for your approval
      </Button>
    </Flex>
  ) : myTransactionState.type !== "waitingForConfirmation" &&
    myTransactionState.type !== "confirmed" ? (
    <Flex variant="layout.actions">
      <Transaction
        id={myTransactionId}
        send={givety.claimCollateralSurplus.bind(givety, undefined)}
      >
        <Button sx={{ mx: 2 }}>Claim {collateralSurplusBalance.prettify()} GIVE</Button>
      </Transaction>
    </Flex>
  ) : null;
};
