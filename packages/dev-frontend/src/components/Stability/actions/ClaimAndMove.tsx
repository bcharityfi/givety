import React from "react";
import { Button } from "theme-ui";
import { useGivety } from "../../../hooks/GivetyContext";
import { useTransactionFunction } from "../../Transaction";

type ClaimAndMoveProps = {
  disabled?: boolean;
};

export const ClaimAndMove: React.FC<ClaimAndMoveProps> = ({ disabled, children }) => {
  const { givety } = useGivety();

  const [sendTransaction] = useTransactionFunction(
    "stability-deposit",
    givety.send.transferCollateralGainToTrove.bind(givety.send)
  );

  return (
    <Button
      variant="outline"
      sx={{ mt: 3, width: "100%" }}
      onClick={sendTransaction}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};
