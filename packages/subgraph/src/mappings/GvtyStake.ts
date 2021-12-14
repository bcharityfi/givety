import { StakeChanged, StakingGainsWithdrawn } from "../../generated/GVTYStaking/GVTYStaking";

import { updateStake, withdrawStakeGains } from "../entities/GvtyStake";

export function handleStakeChanged(event: StakeChanged): void {
  updateStake(event, event.params.staker, event.params.newStake);
}

export function handleStakeGainsWithdrawn(event: StakingGainsWithdrawn): void {
  withdrawStakeGains(event, event.params.staker, event.params.GUSDGain, event.params.GIVEGain);
}
