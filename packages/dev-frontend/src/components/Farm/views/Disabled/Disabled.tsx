import React from "react";
import { Card, Heading, Box, Flex } from "theme-ui";
import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { InfoMessage } from "../../../InfoMessage";
import { UnstakeAndClaim } from "../UnstakeAndClaim";
import { RemainingGVTY } from "../RemainingGVTY";
import { StaticRow } from "../../../Trove/Editor";
import { GT, LP } from "../../../../strings";

const selector = ({ liquidityMiningStake, liquidityMiningGVTYReward }: GivetyStoreState) => ({
  liquidityMiningStake,
  liquidityMiningGVTYReward
});

export const Disabled: React.FC = () => {
  const { liquidityMiningStake, liquidityMiningGVTYReward } = useGivetySelector(selector);
  const hasStake = !liquidityMiningStake.isZero;

  return (
    <Card>
      <Heading>
        GiveSwap Liquidity Farm
        <Flex sx={{ justifyContent: "flex-end" }}>
          <RemainingGVTY />
        </Flex>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title="Liquidity farming period has finished">
          <Flex>There are no more GVTY rewards left to farm</Flex>
        </InfoMessage>
        {hasStake && (
          <>
            <Box sx={{ border: 1, pt: 3, borderRadius: 3 }}>
              <StaticRow
                label="Stake"
                inputId="farm-deposit"
                amount={liquidityMiningStake.prettify(4)}
                unit={LP}
              />
              <StaticRow
                label="Reward"
                inputId="farm-reward"
                amount={liquidityMiningGVTYReward.prettify(4)}
                color={liquidityMiningGVTYReward.nonZero && "success"}
                unit={GT}
              />
            </Box>
            <UnstakeAndClaim />
          </>
        )}
      </Box>
    </Card>
  );
};
