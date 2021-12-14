import { ethereum, BigInt } from "@graphprotocol/graph-ts";

import { Redemption } from "../../generated/schema";

import { decimalize, DECIMAL_ZERO } from "../utils/bignumbers";

import { getGlobal, getRedemptionSequenceNumber } from "./Global";
import { getTransaction } from "./Transaction";
import { getUser } from "./User";

export function getCurrentRedemption(event: ethereum.Event): Redemption {
  let currentRedemptionId = getGlobal().currentRedemption;
  let currentRedemptionOrNull = Redemption.load(currentRedemptionId);

  if (currentRedemptionOrNull == null) {
    let sequenceNumber = getRedemptionSequenceNumber();
    let newRedemption = new Redemption(sequenceNumber.toString());

    newRedemption.sequenceNumber = sequenceNumber;
    newRedemption.transaction = getTransaction(event).id;
    newRedemption.redeemer = getUser(event.transaction.from).id;
    newRedemption.tokensAttemptedToRedeem = DECIMAL_ZERO;
    newRedemption.tokensActuallyRedeemed = DECIMAL_ZERO;
    newRedemption.collateralRedeemed = DECIMAL_ZERO;
    newRedemption.partial = false;
    newRedemption.fee = DECIMAL_ZERO;
    newRedemption.save();

    let global = getGlobal();
    global.currentRedemption = newRedemption.id;
    global.save();

    currentRedemptionOrNull = newRedemption;
  }

  return currentRedemptionOrNull as Redemption;
}

export function finishCurrentRedemption(
  event: ethereum.Event,
  _attemptedGUSDAmount: BigInt,
  _actualGUSDAmount: BigInt,
  _GIVESent: BigInt,
  _GIVEFee: BigInt
): void {
  let fee = decimalize(_GIVEFee);

  let currentRedemption = getCurrentRedemption(event);
  currentRedemption.tokensAttemptedToRedeem = decimalize(_attemptedGUSDAmount);
  currentRedemption.tokensActuallyRedeemed = decimalize(_actualGUSDAmount);
  currentRedemption.collateralRedeemed = decimalize(_GIVESent);
  currentRedemption.partial = _actualGUSDAmount < _attemptedGUSDAmount;
  currentRedemption.fee = fee;
  currentRedemption.save();

  let global = getGlobal();
  global.currentRedemption = null;
  global.totalRedemptionFeesPaid = global.totalRedemptionFeesPaid.plus(fee);
  global.save();
}
