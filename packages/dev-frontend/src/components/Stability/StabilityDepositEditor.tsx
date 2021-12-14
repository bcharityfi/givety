import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";

import {
  Decimal,
  Decimalish,
  StabilityDeposit,
  GivetyStoreState,
  Difference
} from "givety-lib-base";

import { useGivetySelector } from "givety-lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../Icon";
import { EditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";
import { InfoIcon } from "../InfoIcon";

const select = ({ gusdBalance, gusdInStabilityPool }: GivetyStoreState) => ({
  gusdBalance,
  gusdInStabilityPool
});

type StabilityDepositEditorProps = {
  originalDeposit: StabilityDeposit;
  editedGUSD: Decimal;
  changePending: boolean;
  dispatch: (action: { type: "setDeposit"; newValue: Decimalish } | { type: "revert" }) => void;
};

export const StabilityDepositEditor: React.FC<StabilityDepositEditorProps> = ({
  originalDeposit,
  editedGUSD,
  changePending,
  dispatch,
  children
}) => {
  const { gusdBalance, gusdInStabilityPool } = useGivetySelector(select);
  const editingState = useState<string>();

  const edited = !editedGUSD.eq(originalDeposit.currentGUSD);

  const maxAmount = originalDeposit.currentGUSD.add(gusdBalance);
  const maxedOut = editedGUSD.eq(maxAmount);

  const gusdInStabilityPoolAfterChange = gusdInStabilityPool
    .sub(originalDeposit.currentGUSD)
    .add(editedGUSD);

  const originalPoolShare = originalDeposit.currentGUSD.mulDiv(100, gusdInStabilityPool);
  const newPoolShare = editedGUSD.mulDiv(100, gusdInStabilityPoolAfterChange);
  const poolShareChange =
    originalDeposit.currentGUSD.nonZero &&
    Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        Stability Pool
        {edited && !changePending && (
          <Button
            variant="titleIcon"
            sx={{ ":enabled:hover": { color: "danger" } }}
            onClick={() => dispatch({ type: "revert" })}
          >
            <Icon name="history" size="lg" />
          </Button>
        )}
      </Heading>

      <Box sx={{ p: [2, 3] }}>
        <EditableRow
          label="Deposit"
          inputId="deposit-gvty"
          amount={editedGUSD.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={COIN}
          {...{ editingState }}
          editedAmount={editedGUSD.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setDeposit", newValue })}
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="deposit-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="deposit-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalDeposit.isEmpty && (
          <>
            <StaticRow
              label="Liquidation gain"
              inputId="deposit-gain"
              amount={originalDeposit.collateralGain.prettify(4)}
              color={originalDeposit.collateralGain.nonZero && "success"}
              unit="GIVE"
            />

            <StaticRow
              label="Reward"
              inputId="deposit-reward"
              amount={originalDeposit.gvtyReward.prettify()}
              color={originalDeposit.gvtyReward.nonZero && "success"}
              unit={GT}
              infoIcon={
                <InfoIcon
                  tooltip={
                    <Card variant="tooltip" sx={{ width: "240px" }}>
                      Although the GVTY rewards accrue every minute, the value on the UI only updates
                      when a user transacts with the Stability Pool. Therefore you may receive more
                      rewards than is displayed when you claim or adjust your deposit.
                    </Card>
                  }
                />
              }
            />
          </>
        )}
        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
