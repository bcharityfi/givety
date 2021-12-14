import React, { useCallback } from "react";
import { Card, Heading, Box, Flex, Button, Link, Paragraph } from "theme-ui";
import { useGivety } from "../../../../hooks/GivetyContext";
import { Icon } from "../../../Icon";
import { InfoMessage } from "../../../InfoMessage";
import { useFarmView } from "../../context/FarmViewContext";
import { RemainingGVTY } from "../RemainingGVTY";
import { Yield } from "../Yield";

const uniLink = (gusdAddress: string) => `https://app.giveswap.org/#/add/GIVE/${gusdAddress}`;

export const Inactive: React.FC = () => {
  const { dispatchEvent } = useFarmView();

  const {
    givety: {
      connection: { addresses }
    }
  } = useGivety();

  const handleStakePressed = useCallback(() => {
    dispatchEvent("STAKE_PRESSED");
  }, [dispatchEvent]);

  return (
    <Card>
      <Heading>
        GiveSwap Liquidity Farm
        <Flex sx={{ justifyContent: "flex-end" }}>
          <RemainingGVTY />
        </Flex>
      </Heading>
      <Box sx={{ p: [2, 3] }}>
        <InfoMessage title="You aren't farming GVTY.">
          <Paragraph>You can farm GVTY by staking your GiveSwap GIVE/GUSD LP tokens.</Paragraph>

          <Paragraph sx={{ mt: 2 }}>
            You can obtain LP tokens by adding liquidity to the{" "}
            <Link href={uniLink(addresses["gusdToken"])} target="_blank">
              GIVE/GUSD pool on GiveSwap. <Icon name="external-link-alt" size="xs" />
            </Link>
          </Paragraph>
        </InfoMessage>

        <Flex variant="layout.actions">
          <Flex sx={{ justifyContent: "flex-start", alignItems: "center", flex: 1 }}>
            <Yield />
          </Flex>
          <Button onClick={handleStakePressed}>Stake</Button>
        </Flex>
      </Box>
    </Card>
  );
};
