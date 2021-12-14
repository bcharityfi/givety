import React, { useState } from "react";
import { Heading, Box, Card, Button } from "theme-ui";

import { Decimal, Decimalish, Difference, GivetyStoreState, GVTYStake } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { COIN, GT } from "../../strings";

import { Icon } from "../Icon";
import { EditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";

import { useStakingView } from "./context/StakingViewContext";

const select = ({ gvtyBalance, totalStakedGVTY }: GivetyStoreState) => ({
  gvtyBalance,
  totalStakedGVTY
});

type StakingEditorProps = {
  title: string;
  originalStake: GVTYStake;
  editedGVTY: Decimal;
  dispatch: (action: { type: "setStake"; newValue: Decimalish } | { type: "revert" }) => void;
};

export const StakingEditor: React.FC<StakingEditorProps> = ({
  children,
  title,
  originalStake,
  editedGVTY,
  dispatch
}) => {
  const { gvtyBalance, totalStakedGVTY } = useGivetySelector(select);
  const { changePending } = useStakingView();
  const editingState = useState<string>();

  const edited = !editedGVTY.eq(originalStake.stakedGVTY);

  const maxAmount = originalStake.stakedGVTY.add(gvtyBalance);
  const maxedOut = editedGVTY.eq(maxAmount);

  const totalStakedGVTYAfterChange = totalStakedGVTY.sub(originalStake.stakedGVTY).add(editedGVTY);

  const originalPoolShare = originalStake.stakedGVTY.mulDiv(100, totalStakedGVTY);
  const newPoolShare = editedGVTY.mulDiv(100, totalStakedGVTYAfterChange);
  const poolShareChange =
    originalStake.stakedGVTY.nonZero && Difference.between(newPoolShare, originalPoolShare).nonZero;

  return (
    <Card>
      <Heading>
        {title}
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
          label="Stake"
          inputId="stake-gvty"
          amount={editedGVTY.prettify()}
          maxAmount={maxAmount.toString()}
          maxedOut={maxedOut}
          unit={GT}
          {...{ editingState }}
          editedAmount={editedGVTY.toString(2)}
          setEditedAmount={newValue => dispatch({ type: "setStake", newValue })}
        />

        {newPoolShare.infinite ? (
          <StaticRow label="Pool share" inputId="stake-share" amount="N/A" />
        ) : (
          <StaticRow
            label="Pool share"
            inputId="stake-share"
            amount={newPoolShare.prettify(4)}
            pendingAmount={poolShareChange?.prettify(4).concat("%")}
            pendingColor={poolShareChange?.positive ? "success" : "danger"}
            unit="%"
          />
        )}

        {!originalStake.isEmpty && (
          <>
            <StaticRow
              label="Redemption gain"
              inputId="stake-gain-eth"
              amount={originalStake.collateralGain.prettify(4)}
              color={originalStake.collateralGain.nonZero && "success"}
              unit="GIVE"
            />

            <StaticRow
              label="Issuance gain"
              inputId="stake-gain-gusd"
              amount={originalStake.gusdGain.prettify()}
              color={originalStake.gusdGain.nonZero && "success"}
              unit={COIN}
            />
          </>
        )}

        {children}
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
