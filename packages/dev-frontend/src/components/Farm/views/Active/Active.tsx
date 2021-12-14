import React, { useCallback } from "react";
import { Card, Heading, Box, Flex, Button } from "theme-ui";
import { LP, GT } from "../../../../strings";
import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { Icon } from "../../../Icon";
import { LoadingOverlay } from "../../../LoadingOverlay";
import { useMyTransactionState } from "../../../Transaction";
import { DisabledEditableRow, StaticRow } from "../../../Trove/Editor";
import { useFarmView } from "../../context/FarmViewContext";
import { RemainingGVTY } from "../RemainingGVTY";
import { ClaimReward } from "./ClaimReward";
import { UnstakeAndClaim } from "../UnstakeAndClaim";
import { Yield } from "../Yield";

const selector = ({
  liquidityMiningStake,
  liquidityMiningGVTYReward,
  totalStakedGivTokens
}: GivetyStoreState) => ({
  liquidityMiningStake,
  liquidityMiningGVTYReward,
  totalStakedGivTokens
});
const transactionId = /farm-/i;

export const Active: React.FC = () => {
  const { dispatchEvent } = useFarmView();
  const {
    liquidityMiningStake,
    liquidityMiningGVTYReward,
    totalStakedGivTokens
  } = useGivetySelector(selector);

  const handleAdjustPressed = useCallback(() => {
    dispatchEvent("ADJUST_PRESSED");
  }, [dispatchEvent]);

  const transactionState = useMyTransactionState(transactionId);
  const isTransactionPending =
    transactionState.type === "waitingForApproval" ||
    transactionState.type === "waitingForConfirmation";

  const poolShare = liquidityMiningStake.mulDiv(100, totalStakedGivTokens);
  const hasStakeAndRewards = !liquidityMiningStake.isZero && !liquidityMiningGVTYReward.isZero;

  return (
    <Card>
      <Heading>
        GiveSwap Liquidity Farm
        {!isTransactionPending && (
          <Flex sx={{ justifyContent: "flex-end" }}>
            <RemainingGVTY />
          </Flex>
        )}
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <Box>
          <DisabledEditableRow
            label="Stake"
            inputId="farm-stake"
            amount={liquidityMiningStake.prettify(4)}
            unit={LP}
          />
          {poolShare.infinite ? (
            <StaticRow label="Pool share" inputId="farm-share" amount="N/A" />
          ) : (
            <StaticRow
              label="Pool share"
              inputId="farm-share"
              amount={poolShare.prettify(4)}
              unit={"%"}
            />
          )}
          <Flex sx={{ alignItems: "center" }}>
            <StaticRow
              label="Reward"
              inputId="farm-reward"
              amount={liquidityMiningGVTYReward.prettify(4)}
              color={liquidityMiningGVTYReward.nonZero && "success"}
              unit={GT}
            />
            <Flex sx={{ justifyContent: "flex-end", flex: 1 }}>
              <Yield />
            </Flex>
          </Flex>
        </Box>

        <Flex variant="layout.actions">
          <Button
            variant={!liquidityMiningGVTYReward.isZero ? "outline" : "primary"}
            onClick={handleAdjustPressed}
          >
            <Icon name="pen" size="sm" />
            &nbsp;Adjust
          </Button>
          {!liquidityMiningGVTYReward.isZero && <ClaimReward />}
        </Flex>
        <Flex>{hasStakeAndRewards && <UnstakeAndClaim />}</Flex>
      </Box>
      {isTransactionPending && <LoadingOverlay />}
    </Card>
  );
};
