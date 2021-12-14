import React, { useState, useEffect } from "react";
import { Card, Box, Heading, Flex, Button, Label, Input } from "theme-ui";

import { Decimal, GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../hooks/GivetyContext";

import { Icon } from "./Icon";
import { Transaction } from "./Transaction";

const selectPrice = ({ price }: GivetyStoreState) => price;

export const PriceManager: React.FC = () => {
  const {
    givety: {
      send: givety,
      connection: { _priceFeedIsTestnet: canSetPrice }
    }
  } = useGivety();

  const price = useGivetySelector(selectPrice);
  const [editedPrice, setEditedPrice] = useState(price.toString(2));

  useEffect(() => {
    setEditedPrice(price.toString(2));
  }, [price]);

  return (
    <Card>
      <Heading>Price feed</Heading>

      <Box sx={{ p: [2, 3] }}>
        <Flex sx={{ alignItems: "stretch" }}>
          <Label>GIVE</Label>

          <Label variant="unit">$</Label>

          <Input
            type={canSetPrice ? "number" : "text"}
            step="any"
            value={editedPrice}
            onChange={e => setEditedPrice(e.target.value)}
            disabled={!canSetPrice}
          />

          {canSetPrice && (
            <Flex sx={{ ml: 2, alignItems: "center" }}>
              <Transaction
                id="set-price"
                tooltip="Set"
                tooltipPlacement="bottom"
                send={overrides => {
                  if (!editedPrice) {
                    throw new Error("Invalid price");
                  }
                  return givety.setPrice(Decimal.from(editedPrice), overrides);
                }}
              >
                <Button variant="icon">
                  <Icon name="chart-line" size="lg" />
                </Button>
              </Transaction>
            </Flex>
          )}
        </Flex>
      </Box>
    </Card>
  );
};
