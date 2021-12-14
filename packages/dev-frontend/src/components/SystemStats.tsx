import React from "react";
import { Card, Heading, Link, Box, Text } from "theme-ui";
import { AddressZero } from "@ethersproject/constants";
import { Decimal, Percent, GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../hooks/GivetyContext";
import { COIN, GT } from "../strings";
import { Statistic } from "./Statistic";

const selectBalances = ({ accountBalance, gusdBalance, gvtyBalance }: GivetyStoreState) => ({
  accountBalance,
  gusdBalance,
  gvtyBalance
});

const Balances: React.FC = () => {
  const { accountBalance, gusdBalance, gvtyBalance } = useGivetySelector(selectBalances);

  return (
    <Box sx={{ mb: 3 }}>
      <Heading>My Account Balances</Heading>
      <Statistic name="GIVE"> {accountBalance.prettify(4)}</Statistic>
      <Statistic name={COIN}> {gusdBalance.prettify()}</Statistic>
      <Statistic name={GT}>{gvtyBalance.prettify()}</Statistic>
    </Box>
  );
};

const GitHubCommit: React.FC<{ children?: string }> = ({ children }) =>
  children?.match(/[0-9a-f]{40}/) ? (
    <Link href={`https://github.com/givety/dev/commit/${children}`}>{children.substr(0, 7)}</Link>
  ) : (
    <>unknown</>
  );

type SystemStatsProps = {
  variant?: string;
  showBalances?: boolean;
};

const select = ({
  numberOfTroves,
  price,
  total,
  gusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedGVTY,
  frontend
}: GivetyStoreState) => ({
  numberOfTroves,
  price,
  total,
  gusdInStabilityPool,
  borrowingRate,
  redemptionRate,
  totalStakedGVTY,
  kickbackRate: frontend.status === "registered" ? frontend.kickbackRate : null
});

export const SystemStats: React.FC<SystemStatsProps> = ({ variant = "info", showBalances }) => {
  const {
    givety: {
      connection: { version: contractsVersion, deploymentDate, frontendTag }
    }
  } = useGivety();

  const {
    numberOfTroves,
    price,
    gusdInStabilityPool,
    total,
    borrowingRate,
    totalStakedGVTY,
    kickbackRate
  } = useGivetySelector(select);

  const gusdInStabilityPoolPct =
    total.debt.nonZero && new Percent(gusdInStabilityPool.div(total.debt));
  const totalCollateralRatioPct = new Percent(total.collateralRatio(price));
  const borrowingFeePct = new Percent(borrowingRate);
  const kickbackRatePct = frontendTag === AddressZero ? "100" : kickbackRate?.mul(100).prettify();

  return (
    <Card {...{ variant }}>
      {showBalances && <Balances />}

      <Heading>Givety statistics</Heading>

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Protocol
      </Heading>

      <Statistic
        name="Borrowing Fee"
        tooltip="The Borrowing Fee is a one-off fee charged as a percentage of the borrowed amount (in GUSD) and is part of a Trove's debt. The fee varies between 0.5% and 5% depending on GUSD redemption volumes."
      >
        {borrowingFeePct.toString(2)}
      </Statistic>

      <Statistic
        name="TVL"
        tooltip="The Total Value Locked (TVL) is the total value of Give locked as collateral in the system, given in GIVE and USD."
      >
        {total.collateral.shorten()} <Text sx={{ fontSize: 1 }}>&nbsp;GIVE</Text>
        <Text sx={{ fontSize: 1 }}>
          &nbsp;(${Decimal.from(total.collateral.mul(price)).shorten()})
        </Text>
      </Statistic>
      <Statistic name="Troves" tooltip="The total number of active Troves in the system.">
        {Decimal.from(numberOfTroves).prettify(0)}
      </Statistic>
      <Statistic name="GUSD supply" tooltip="The total GUSD minted by the Givety Protocol.">
        {total.debt.shorten()}
      </Statistic>
      {gusdInStabilityPoolPct && (
        <Statistic
          name="GUSD in Stability Pool"
          tooltip="The total GUSD currently held in the Stability Pool, expressed as an amount and a fraction of the GUSD supply.
        "
        >
          {gusdInStabilityPool.shorten()}
          <Text sx={{ fontSize: 1 }}>&nbsp;({gusdInStabilityPoolPct.toString(1)})</Text>
        </Statistic>
      )}
      <Statistic
        name="Staked GVTY"
        tooltip="The total amount of GVTY that is staked for earning fee revenue."
      >
        {totalStakedGVTY.shorten()}
      </Statistic>
      <Statistic
        name="Total Collateral Ratio"
        tooltip="The ratio of the Dollar value of the entire system collateral at the current GIVE:USD price, to the entire system debt."
      >
        {totalCollateralRatioPct.prettify()}
      </Statistic>
      <Statistic
        name="Recovery Mode"
        tooltip="Recovery Mode is activated when the Total Collateral Ratio (TCR) falls below 150%. When active, your Trove can be liquidated if its collateral ratio is below the TCR. The maximum collateral you can lose from liquidation is capped at 110% of your Trove's debt. Operations are also restricted that would negatively impact the TCR."
      >
        {total.collateralRatioIsBelowCritical(price) ? <Box color="danger">Yes</Box> : "No"}
      </Statistic>
      {}

      <Heading as="h2" sx={{ mt: 3, fontWeight: "body" }}>
        Frontend
      </Heading>
      {kickbackRatePct && (
        <Statistic
          name="Kickback Rate"
          tooltip="A rate between 0 and 100% set by the Frontend Operator that determines the fraction of GVTY that will be paid out as a kickback to the Stability Providers using the frontend."
        >
          {kickbackRatePct}%
        </Statistic>
      )}

      <Box sx={{ mt: 3, opacity: 0.66 }}>
        <Box sx={{ fontSize: 0 }}>
          Contracts version: <GitHubCommit>{contractsVersion}</GitHubCommit>
        </Box>
        <Box sx={{ fontSize: 0 }}>Deployed: {deploymentDate.toLocaleString()}</Box>
        <Box sx={{ fontSize: 0 }}>
          Frontend version:{" "}
          {process.env.NODE_ENV === "development" ? (
            "development"
          ) : (
            <GitHubCommit>{process.env.REACT_APP_VERSION}</GitHubCommit>
          )}
        </Box>
      </Box>
    </Card>
  );
};
