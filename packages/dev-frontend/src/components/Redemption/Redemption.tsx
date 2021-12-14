import { BlockPolledGivetyStoreState } from "@givety/lib-ethers";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../../hooks/GivetyContext";
import { DisabledRedemption } from "./DisabledRedemption";
import { RedemptionManager } from "./RedemptionManager";

const SECONDS_IN_ONE_DAY = 24 * 60 * 60;

const selectBlockTimestamp = ({ blockTimestamp }: BlockPolledGivetyStoreState) => blockTimestamp;

export const Redemption: React.FC = () => {
  const {
    givety: {
      connection: { deploymentDate, bootstrapPeriod }
    }
  } = useGivety();

  const blockTimestamp = useGivetySelector(selectBlockTimestamp);

  const bootstrapPeriodDays = Math.round(bootstrapPeriod / SECONDS_IN_ONE_DAY);
  const deploymentTime = deploymentDate.getTime() / 1000;
  const bootstrapEndTime = deploymentTime + bootstrapPeriod;
  const bootstrapEndDate = new Date(bootstrapEndTime * 1000);
  const redemptionDisabled = blockTimestamp < bootstrapEndTime;

  if (redemptionDisabled) {
    return <DisabledRedemption disabledDays={bootstrapPeriodDays} unlockDate={bootstrapEndDate} />;
  }

  return <RedemptionManager />;
};
