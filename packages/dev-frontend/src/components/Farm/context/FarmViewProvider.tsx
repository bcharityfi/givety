import React, { useState, useCallback, useEffect, useRef } from "react";
import { GivetyStoreState, Decimal } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { FarmViewContext } from "./FarmViewContext";
import { transitions } from "./transitions";
import type { FarmView, FarmEvent } from "./transitions";

const transition = (view: FarmView, event: FarmEvent): FarmView => {
  const nextView = transitions[view][event] ?? view;
  return nextView;
};

const getInitialView = (
  liquidityMiningStake: Decimal,
  remainingLiquidityMiningGVTYReward: Decimal,
  liquidityMiningGVTYReward: Decimal
): FarmView => {
  if (remainingLiquidityMiningGVTYReward.isZero) return "DISABLED";
  if (liquidityMiningStake.isZero && liquidityMiningGVTYReward.isZero) return "INACTIVE";
  return "ACTIVE";
};

const selector = ({
  liquidityMiningStake,
  remainingLiquidityMiningGVTYReward,
  liquidityMiningGVTYReward
}: GivetyStoreState) => ({
  liquidityMiningStake,
  remainingLiquidityMiningGVTYReward,
  liquidityMiningGVTYReward
});

export const FarmViewProvider: React.FC = props => {
  const { children } = props;
  const {
    liquidityMiningStake,
    remainingLiquidityMiningGVTYReward,
    liquidityMiningGVTYReward
  } = useGivetySelector(selector);

  const [view, setView] = useState<FarmView>(
    getInitialView(
      liquidityMiningStake,
      remainingLiquidityMiningGVTYReward,
      liquidityMiningGVTYReward
    )
  );
  const viewRef = useRef<FarmView>(view);

  const dispatchEvent = useCallback((event: FarmEvent) => {
    const nextView = transition(viewRef.current, event);

    console.log(
      "dispatchEvent() [current-view, event, next-view]",
      viewRef.current,
      event,
      nextView
    );
    setView(nextView);
  }, []);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (liquidityMiningStake.isZero && liquidityMiningGVTYReward.isZero) {
      dispatchEvent("UNSTAKE_AND_CLAIM_CONFIRMED");
    } else if (liquidityMiningStake.isZero && !liquidityMiningGVTYReward.isZero) {
      dispatchEvent("UNSTAKE_CONFIRMED");
    }
  }, [liquidityMiningStake.isZero, liquidityMiningGVTYReward.isZero, dispatchEvent]);

  const provider = {
    view,
    dispatchEvent
  };

  return <FarmViewContext.Provider value={provider}>{children}</FarmViewContext.Provider>;
};
