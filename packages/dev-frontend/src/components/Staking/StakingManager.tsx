import React from "react";
import { Button, Flex } from "theme-ui";

import {
  Decimal,
  Decimalish,
  GivetyStoreState,
  GVTYStake,
  GVTYStakeChange
} from "givety-lib-base";

import { GivetyStoreUpdate, useGivetyReducer, useGivetySelector } from "givety-lib-react";

import { GT, COIN } from "../../strings";

import { useStakingView } from "./context/StakingViewContext";
import { StakingEditor } from "./StakingEditor";
import { StakingManagerAction } from "./StakingManagerAction";
import { ActionDescription, Amount } from "../ActionDescription";
import { ErrorDescription } from "../ErrorDescription";

const init = ({ gvtyStake }: GivetyStoreState) => ({
  originalStake: gvtyStake,
  editedGVTY: gvtyStake.stakedGVTY
});

type StakeManagerState = ReturnType<typeof init>;
type StakeManagerAction =
  | GivetyStoreUpdate
  | { type: "revert" }
  | { type: "setStake"; newValue: Decimalish };

const reduce = (state: StakeManagerState, action: StakeManagerAction): StakeManagerState => {
  // console.log(state);
  // console.log(action);

  const { originalStake, editedGVTY } = state;

  switch (action.type) {
    case "setStake":
      return { ...state, editedGVTY: Decimal.from(action.newValue) };

    case "revert":
      return { ...state, editedGVTY: originalStake.stakedGVTY };

    case "updateStore": {
      const {
        stateChange: { gvtyStake: updatedStake }
      } = action;

      if (updatedStake) {
        return {
          originalStake: updatedStake,
          editedGVTY: updatedStake.apply(originalStake.whatChanged(editedGVTY))
        };
      }
    }
  }

  return state;
};

const selectGVTYBalance = ({ gvtyBalance }: GivetyStoreState) => gvtyBalance;

type StakingManagerActionDescriptionProps = {
  originalStake: GVTYStake;
  change: GVTYStakeChange<Decimal>;
};

const StakingManagerActionDescription: React.FC<StakingManagerActionDescriptionProps> = ({
  originalStake,
  change
}) => {
  const stakeGVTY = change.stakeGVTY?.prettify().concat(" ", GT);
  const unstakeGVTY = change.unstakeGVTY?.prettify().concat(" ", GT);
  const collateralGain = originalStake.collateralGain.nonZero?.prettify(4).concat(" GIVE");
  const gusdGain = originalStake.gusdGain.nonZero?.prettify().concat(" ", COIN);

  if (originalStake.isEmpty && stakeGVTY) {
    return (
      <ActionDescription>
        You are staking <Amount>{stakeGVTY}</Amount>.
      </ActionDescription>
    );
  }

  return (
    <ActionDescription>
      {stakeGVTY && (
        <>
          You are adding <Amount>{stakeGVTY}</Amount> to your stake
        </>
      )}
      {unstakeGVTY && (
        <>
          You are withdrawing <Amount>{unstakeGVTY}</Amount> to your wallet
        </>
      )}
      {(collateralGain || gusdGain) && (
        <>
          {" "}
          and claiming{" "}
          {collateralGain && gusdGain ? (
            <>
              <Amount>{collateralGain}</Amount> and <Amount>{gusdGain}</Amount>
            </>
          ) : (
            <>
              <Amount>{collateralGain ?? gusdGain}</Amount>
            </>
          )}
        </>
      )}
      .
    </ActionDescription>
  );
};

export const StakingManager: React.FC = () => {
  const { dispatch: dispatchStakingViewAction } = useStakingView();
  const [{ originalStake, editedGVTY }, dispatch] = useGivetyReducer(reduce, init);
  const gvtyBalance = useGivetySelector(selectGVTYBalance);

  const change = originalStake.whatChanged(editedGVTY);
  const [validChange, description] = !change
    ? [undefined, undefined]
    : change.stakeGVTY?.gt(gvtyBalance)
    ? [
        undefined,
        <ErrorDescription>
          The amount you're trying to stake exceeds your balance by{" "}
          <Amount>
            {change.stakeGVTY.sub(gvtyBalance).prettify()} {GT}
          </Amount>
          .
        </ErrorDescription>
      ]
    : [change, <StakingManagerActionDescription originalStake={originalStake} change={change} />];

  const makingNewStake = originalStake.isEmpty;

  return (
    <StakingEditor title={"Staking"} {...{ originalStake, editedGVTY, dispatch }}>
      {description ??
        (makingNewStake ? (
          <ActionDescription>Enter the amount of {GT} you'd like to stake.</ActionDescription>
        ) : (
          <ActionDescription>Adjust the {GT} amount to stake or withdraw.</ActionDescription>
        ))}

      <Flex variant="layout.actions">
        <Button
          variant="cancel"
          onClick={() => dispatchStakingViewAction({ type: "cancelAdjusting" })}
        >
          Cancel
        </Button>

        {validChange ? (
          <StakingManagerAction change={validChange}>Confirm</StakingManagerAction>
        ) : (
          <Button disabled>Confirm</Button>
        )}
      </Flex>
    </StakingEditor>
  );
};
