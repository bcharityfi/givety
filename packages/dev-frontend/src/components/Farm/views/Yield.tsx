import React, { useEffect, useState } from "react";
import { Card, Paragraph, Text } from "theme-ui";
import { Decimal, GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { InfoIcon } from "../../InfoIcon";
import { useGivety } from "../../../hooks/GivetyContext";
import { Badge } from "../../Badge";
import { fetchPrices } from "../context/fetchPrices";

const selector = ({
  remainingLiquidityMiningGVTYReward,
  totalStakedGivTokens
}: GivetyStoreState) => ({
  remainingLiquidityMiningGVTYReward,
  totalStakedGivTokens
});

export const Yield: React.FC = () => {
  const {
    givety: {
      connection: { addresses, liquidityMiningGVTYRewardRate }
    }
  } = useGivety();

  const { remainingLiquidityMiningGVTYReward, totalStakedGivTokens } = useGivetySelector(selector);
  const [gvtyPrice, setGvtyPrice] = useState<Decimal | undefined>(undefined);
  const [uniLpPrice, setUniLpPrice] = useState<Decimal | undefined>(undefined);
  const hasZeroValue = remainingLiquidityMiningGVTYReward.isZero || totalStakedGivTokens.isZero;
  const gvtyTokenAddress = addresses["gvtyToken"];
  const givTokenAddress = addresses["givToken"];
  const secondsRemaining = remainingLiquidityMiningGVTYReward.div(liquidityMiningGVTYRewardRate);
  const daysRemaining = secondsRemaining.div(60 * 60 * 24);

  useEffect(() => {
    (async () => {
      try {
        const { gvtyPriceUSD, uniLpPriceUSD } = await fetchPrices(gvtyTokenAddress, givTokenAddress);
        setGvtyPrice(gvtyPriceUSD);
        setUniLpPrice(uniLpPriceUSD);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [gvtyTokenAddress, givTokenAddress]);

  if (hasZeroValue || gvtyPrice === undefined || uniLpPrice === undefined) return null;

  const remainingGvtyInUSD = remainingLiquidityMiningGVTYReward.mul(gvtyPrice);
  const totalStakedUniLpInUSD = totalStakedGivTokens.mul(uniLpPrice);
  const yieldPercentage = remainingGvtyInUSD.div(totalStakedUniLpInUSD).mul(100);

  if (yieldPercentage.isZero) return null;

  return (
    <Badge>
      <Text>
        {daysRemaining?.prettify(0)} day yield {yieldPercentage.toString(2)}%
      </Text>
      <InfoIcon
        tooltip={
          <Card variant="tooltip" sx={{ minWidth: ["auto", "352px"] }}>
            <Paragraph>
              An <Text sx={{ fontWeight: "bold" }}>estimate</Text> of the GVTY return on staked UNI
              LP tokens. The farm runs for 6-weeks, and the return is relative to the time remaining.
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace", mt: 2 }}>
              ($GVTY_REWARDS / $STAKED_UNI_LP) * 100 ={" "}
              <Text sx={{ fontWeight: "bold" }}> Yield</Text>
            </Paragraph>
            <Paragraph sx={{ fontSize: "12px", fontFamily: "monospace" }}>
              ($
              {remainingGvtyInUSD.shorten()} / ${totalStakedUniLpInUSD.shorten()}) * 100 =
              <Text sx={{ fontWeight: "bold" }}> {yieldPercentage.toString(2)}%</Text>
            </Paragraph>
          </Card>
        }
      ></InfoIcon>
    </Badge>
  );
};
