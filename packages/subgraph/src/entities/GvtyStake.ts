import { ethereum, Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

import { GvtyStakeChange, GvtyStake } from "../../generated/schema";

import { decimalize, DECIMAL_ZERO, BIGINT_ZERO } from "../utils/bignumbers";

import {
  decreaseNumberOfActiveGVTYStakes,
  increaseNumberOfActiveGVTYStakes,
  increaseTotalNumberOfGVTYStakes
} from "./Global";

import { getUser } from "./User";
import { beginChange, initChange, finishChange } from "./Change";
import { updateSystemStateByGvtyStakeChange } from "./SystemState";

function startGVTYStakeChange(event: ethereum.Event): GvtyStakeChange {
  let sequenceNumber = beginChange();
  let stakeChange = new GvtyStakeChange(sequenceNumber.toString());
  stakeChange.issuanceGain = DECIMAL_ZERO;
  stakeChange.redemptionGain = DECIMAL_ZERO;
  initChange(stakeChange, event, sequenceNumber);
  return stakeChange;
}

function finishGVTYStakeChange(stakeChange: GvtyStakeChange): void {
  finishChange(stakeChange);
  stakeChange.save();
}

function getUserStake(address: Address): GvtyStake | null {
  let user = getUser(address);

  if (user.stake == null) {
    return null;
  }

  return GvtyStake.load(user.stake);
}

function createStake(address: Address): GvtyStake {
  let user = getUser(address);
  let stake = new GvtyStake(address.toHexString());

  stake.owner = user.id;
  stake.amount = DECIMAL_ZERO;

  user.stake = stake.id;
  user.save();

  return stake;
}

function getOperationType(stake: GvtyStake | null, nextStakeAmount: BigDecimal): string {
  let isCreating = stake.amount == DECIMAL_ZERO && nextStakeAmount > DECIMAL_ZERO;
  if (isCreating) {
    return "stakeCreated";
  }

  let isIncreasing = nextStakeAmount > stake.amount;
  if (isIncreasing) {
    return "stakeIncreased";
  }

  let isRemoving = nextStakeAmount == DECIMAL_ZERO;
  if (isRemoving) {
    return "stakeRemoved";
  }

  return "stakeDecreased";
}

export function updateStake(event: ethereum.Event, address: Address, newStake: BigInt): void {
  let stake = getUserStake(address);
  let isUserFirstStake = stake == null;

  if (stake == null) {
    stake = createStake(address);
  }

  let nextStakeAmount = decimalize(newStake);

  let stakeChange = startGVTYStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = getOperationType(stake, nextStakeAmount);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = nextStakeAmount.minus(stake.amount);
  stakeChange.stakedAmountAfter = nextStakeAmount;

  stake.amount = nextStakeAmount;

  if (stakeChange.stakeOperation == "stakeCreated") {
    if (isUserFirstStake) {
      increaseTotalNumberOfGVTYStakes();
    } else {
      increaseNumberOfActiveGVTYStakes();
    }
  } else if (stakeChange.stakeOperation == "stakeRemoved") {
    decreaseNumberOfActiveGVTYStakes();
  }

  updateSystemStateByGvtyStakeChange(stakeChange);
  finishGVTYStakeChange(stakeChange);

  stake.save();
}

export function withdrawStakeGains(
  event: ethereum.Event,
  address: Address,
  GUSDGain: BigInt,
  GIVEGain: BigInt
): void {
  if (GUSDGain == BIGINT_ZERO && GIVEGain == BIGINT_ZERO) {
    return;
  }

  let stake = getUserStake(address) || createStake(address);
  let stakeChange: GvtyStakeChange = startGVTYStakeChange(event);
  stakeChange.stake = stake.id;
  stakeChange.stakeOperation = "gainsWithdrawn";
  stakeChange.issuanceGain = decimalize(GUSDGain);
  stakeChange.redemptionGain = decimalize(GIVEGain);
  stakeChange.stakedAmountBefore = stake.amount;
  stakeChange.stakedAmountChange = DECIMAL_ZERO;
  stakeChange.stakedAmountAfter = stake.amount;

  updateSystemStateByGvtyStakeChange(stakeChange);
  finishGVTYStakeChange(stakeChange);

  stake.save();
}
