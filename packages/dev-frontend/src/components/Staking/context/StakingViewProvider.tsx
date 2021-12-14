import { useEffect } from "react";

import { GivetyStoreState, GVTYStake } from "givety-lib-base";
import { GivetyStoreUpdate, useGivetyReducer } from "givety-lib-react";

import { useMyTransactionState } from "../../Transaction";

import { StakingViewAction, StakingViewContext } from "./StakingViewContext";

type StakingViewProviderAction =
  | GivetyStoreUpdate
  | StakingViewAction
  | { type: "startChange" | "abortChange" };

type StakingViewProviderState = {
  gvtyStake: GVTYStake;
  changePending: boolean;
  adjusting: boolean;
};

const init = ({ gvtyStake }: GivetyStoreState): StakingViewProviderState => ({
  gvtyStake,
  changePending: false,
  adjusting: false
});

const reduce = (
  state: StakingViewProviderState,
  action: StakingViewProviderAction
): StakingViewProviderState => {
  // console.log(state);
  // console.log(action);

  switch (action.type) {
    case "startAdjusting":
      return { ...state, adjusting: true };

    case "cancelAdjusting":
      return { ...state, adjusting: false };

    case "startChange":
      return { ...state, changePending: true };

    case "abortChange":
      return { ...state, changePending: false };

    case "updateStore": {
      const {
        oldState: { gvtyStake: oldStake },
        stateChange: { gvtyStake: updatedStake }
      } = action;

      if (updatedStake) {
        const changeCommitted =
          !updatedStake.stakedGVTY.eq(oldStake.stakedGVTY) ||
          updatedStake.collateralGain.lt(oldStake.collateralGain) ||
          updatedStake.gusdGain.lt(oldStake.gusdGain);

        return {
          ...state,
          gvtyStake: updatedStake,
          adjusting: false,
          changePending: changeCommitted ? false : state.changePending
        };
      }
    }
  }

  return state;
};

export const StakingViewProvider: React.FC = ({ children }) => {
  const stakingTransactionState = useMyTransactionState("stake");
  const [{ adjusting, changePending, gvtyStake }, dispatch] = useGivetyReducer(reduce, init);

  useEffect(() => {
    if (
      stakingTransactionState.type === "waitingForApproval" ||
      stakingTransactionState.type === "waitingForConfirmation"
    ) {
      dispatch({ type: "startChange" });
    } else if (
      stakingTransactionState.type === "failed" ||
      stakingTransactionState.type === "cancelled"
    ) {
      dispatch({ type: "abortChange" });
    }
  }, [stakingTransactionState.type, dispatch]);

  return (
    <StakingViewContext.Provider
      value={{
        view: adjusting ? "ADJUSTING" : gvtyStake.isEmpty ? "NONE" : "ACTIVE",
        changePending,
        dispatch
      }}
    >
      {children}
    </StakingViewContext.Provider>
  );
};
