import React, { useEffect, useState } from "react";
import { Card, Paragraph, Text } from "theme-ui";
import { Decimal, GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { InfoIcon } from "../InfoIcon";
import { useGivety } from "../../hooks/GivetyContext";
import { Badge } from "../Badge";
import { fetchGvtyPrice } from "./context/fetchGvtyPrice";

const selector = ({ gusdInStabilityPool, remainingStabilityPoolGVTYReward }: GivetyStoreState) => ({
  gusdInStabilityPool,
  remainingStabilityPoolGVTYReward
});

export const Yield: React.FC = () => {
  const {
    givety: {
      connection: { addresses }
    }
  } = useGivety();
  const { gusdInStabilityPool, remainingStabilityPoolGVTYReward } = useGivetySelector(selector);

  const [gvtyPrice, setGvtyPrice] = useState<Decimal | undefined>(undefined);
  const hasZeroValue = remainingStabilityPoolGVTYReward.isZero || gusdInStabilityPool.isZero;
  const gvtyTokenAddress = addresses["gvtyToken"];

  useEffect(() => {
    (async () => {
      try {
        const { gvtyPriceUSD } = await fetchGvtyPrice(gvtyTokenAddress);
        setGvtyPrice(gvtyPriceUSD);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [gvtyTokenAddress]);

  if (hasZeroValue || gvtyPrice === undefined) return null;

  const yearlyHalvingSchedule = 0.5; // 50% see GVTY distribution schedule for more info
  const remainingGvtyOneYear = remainingStabilityPoolGVTYReward.mul(yearlyHalvingSchedule);
  const remainingGvtyOneYearInUSD = remainingGvtyOneYear.mul(gvtyPrice);
  const aprPercentage = remainingGvtyOneYearInUSD.div(gusdInStabilityPool).mul(100);
  const remainingGvtyInUSD = remainingStabilityPoolGVTYReward.mul(gvtyPrice);

  if (aprPercentage.isZero) return null;

  return (
    <Badge>
      <Text>GVTY APR {aprPercentage.toString(2)}%</Text>
      <InfoIcon
        tooltip={
          <Card variant="tooltip" sx={{ width: ["220px", "518px"] }}>
            <Paragraph>
              An <Text sx={{ fontWeight: "bold" }}>estimate</Text> of the GVTY return on the GUSD
              deposited to the Stability Pool over the next year, not including your GIVE gains from
              liquidations.
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace", mt: 2 }}>
              (($GVTY_REWARDS * YEARLY_DISTRIBUTION%) / DEPOSITED_GUSD) * 100 ={" "}
              <Text sx={{ fontWeight: "bold" }}> APR</Text>
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace" }}>
              ($
              {remainingGvtyInUSD.shorten()} * 50% / ${gusdInStabilityPool.shorten()}) * 100 =
              <Text sx={{ fontWeight: "bold" }}> {aprPercentage.toString(2)}%</Text>
            </Paragraph>
          </Card>
        }
      ></InfoIcon>
    </Badge>
  );
};
