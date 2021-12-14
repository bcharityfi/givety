import { Heading, Box, Card, Flex, Button } from "theme-ui";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { COIN, GT } from "../../strings";

import { DisabledEditableRow, StaticRow } from "../Trove/Editor";
import { LoadingOverlay } from "../LoadingOverlay";
import { Icon } from "../Icon";

import { useStakingView } from "./context/StakingViewContext";
import { StakingGainsAction } from "./StakingGainsAction";

const select = ({ gvtyStake, totalStakedGVTY }: GivetyStoreState) => ({
  gvtyStake,
  totalStakedGVTY
});

export const ReadOnlyStake: React.FC = () => {
  const { changePending, dispatch } = useStakingView();
  const { gvtyStake, totalStakedGVTY } = useGivetySelector(select);

  const poolShare = gvtyStake.stakedGVTY.mulDiv(100, totalStakedGVTY);

  return (
    <Card>
      <Heading>Staking</Heading>

      <Box sx={{ p: [2, 3] }}>
        <DisabledEditableRow
          label="Stake"
          inputId="stake-gvty"
          amount={gvtyStake.stakedGVTY.prettify()}
          unit={GT}
        />

        <StaticRow
          label="Pool share"
          inputId="stake-share"
          amount={poolShare.prettify(4)}
          unit="%"
        />

        <StaticRow
          label="Redemption gain"
          inputId="stake-gain-eth"
          amount={gvtyStake.collateralGain.prettify(4)}
          color={gvtyStake.collateralGain.nonZero && "success"}
          unit="GIVE"
        />

        <StaticRow
          label="Issuance gain"
          inputId="stake-gain-gusd"
          amount={gvtyStake.gusdGain.prettify()}
          color={gvtyStake.gusdGain.nonZero && "success"}
          unit={COIN}
        />

        <Flex variant="layout.actions">
          <Button variant="outline" onClick={() => dispatch({ type: "startAdjusting" })}>
            <Icon name="pen" size="sm" />
            &nbsp;Adjust
          </Button>

          <StakingGainsAction />
        </Flex>
      </Box>

      {changePending && <LoadingOverlay />}
    </Card>
  );
};
