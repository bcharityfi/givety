import React from "react";
import { Text, Flex, Box, Heading } from "theme-ui";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { COIN, GT } from "../strings";
import { useGivety } from "../hooks/GivetyContext";
import { shortenAddress } from "../utils/shortenAddress";

import { Icon } from "./Icon";

const select = ({ accountBalance, gusdBalance, gvtyBalance }: GivetyStoreState) => ({
  accountBalance,
  gusdBalance,
  gvtyBalance
});

export const UserAccount: React.FC = () => {
  const { account } = useGivety();
  const { accountBalance, gusdBalance, gvtyBalance } = useGivetySelector(select);

  return (
    <Box sx={{ display: ["none", "flex"] }}>
      <Flex sx={{ alignItems: "center" }}>
        <Icon name="user-circle" size="lg" />
        <Flex sx={{ ml: 3, mr: 4, flexDirection: "column" }}>
          <Heading sx={{ fontSize: 1 }}>Connected as</Heading>
          <Text as="span" sx={{ fontSize: 1 }}>
            {shortenAddress(account)}
          </Text>
        </Flex>
      </Flex>

      <Flex sx={{ alignItems: "center" }}>
        <Icon name="wallet" size="lg" />

        {([
          ["GIVE", accountBalance],
          [COIN, gusdBalance],
          [GT, gvtyBalance]
        ] as const).map(([currency, balance], i) => (
          <Flex key={i} sx={{ ml: 3, flexDirection: "column" }}>
            <Heading sx={{ fontSize: 1 }}>{currency}</Heading>
            <Text sx={{ fontSize: 1 }}>{balance.prettify()}</Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};
