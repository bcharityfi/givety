import React from "react";
import { Flex } from "theme-ui";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

const selector = ({ remainingLiquidityMiningGVTYReward }: GivetyStoreState) => ({
  remainingLiquidityMiningGVTYReward
});

export const RemainingGVTY: React.FC = () => {
  const { remainingLiquidityMiningGVTYReward } = useGivetySelector(selector);

  return (
    <Flex sx={{ mr: 2, fontSize: 2, fontWeight: "medium" }}>
      {remainingLiquidityMiningGVTYReward.prettify(0)} GVTY remaining
    </Flex>
  );
};
