import React from "react";
import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";
import { Container, Flex, Box } from "theme-ui";
import { AddressZero } from "@ethersproject/constants";
import { useGivety } from "../hooks/GivetyContext";

import { GivetyLogo } from "./GivetyLogo";
import { Nav } from "./Nav";
import { SideNav } from "./SideNav";

const logoHeight = "32px";

const select = ({ frontend }: GivetyStoreState) => ({
  frontend
});

export const Header: React.FC = ({ children }) => {
  const {
    config: { frontendTag }
  } = useGivety();
  const { frontend } = useGivetySelector(select);
  const isFrontendRegistered = frontendTag === AddressZero || frontend.status === "registered";

  return (
    <Container variant="header">
      <Flex sx={{ alignItems: "center", flex: 1 }}>
        <GivetyLogo height={logoHeight} />

        <Box
          sx={{
            mx: [2, 3],
            width: "0px",
            height: "100%",
            borderLeft: ["none", "1px solid lightgrey"]
          }}
        />
        {isFrontendRegistered && (
          <>
            <SideNav />
            <Nav />
          </>
        )}
      </Flex>

      {children}
    </Container>
  );
};
