import React from "react";
import { Flex, Container } from "theme-ui";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import { Wallet } from "@ethersproject/wallet";

import { Decimal, Difference, Trove } from "givety-lib-base";
import { GivetyStoreProvider } from "givety-lib-react";

import { useGivety } from "./hooks/GivetyContext";
import { TransactionMonitor } from "./components/Transaction";
import { UserAccount } from "./components/UserAccount";
import { SystemStatsPopup } from "./components/SystemStatsPopup";
import { Header } from "./components/Header";

import { PageSwitcher } from "./pages/PageSwitcher";
import { Farm } from "./pages/Farm";
import { RiskyTrovesPage } from "./pages/RiskyTrovesPage";
import { RedemptionPage } from "./pages/RedemptionPage";

import { TroveViewProvider } from "./components/Trove/context/TroveViewProvider";
import { StabilityViewProvider } from "./components/Stability/context/StabilityViewProvider";
import { StakingViewProvider } from "./components/Staking/context/StakingViewProvider";
import { FarmViewProvider } from "./components/Farm/context/FarmViewProvider";

type GivetyFrontendProps = {
  loader?: React.ReactNode;
};
export const GivetyFrontend: React.FC<GivetyFrontendProps> = ({ loader }) => {
  const { account, provider, givety } = useGivety();

  // For console tinkering ;-)
  Object.assign(window, {
    account,
    provider,
    givety,
    Trove,
    Decimal,
    Difference,
    Wallet
  });

  return (
    <GivetyStoreProvider {...{ loader }} store={givety.store}>
      <Router>
        <TroveViewProvider>
          <StabilityViewProvider>
            <StakingViewProvider>
              <FarmViewProvider>
                <Flex sx={{ flexDirection: "column", minHeight: "100%" }}>
                  <Header>
                    <UserAccount />
                    <SystemStatsPopup />
                  </Header>

                  <Container
                    variant="main"
                    sx={{
                      display: "flex",
                      flexGrow: 1,
                      flexDirection: "column",
                      alignItems: "center"
                    }}
                  >
                    <Switch>
                      <Route path="/" exact>
                        <PageSwitcher />
                      </Route>
                      <Route path="/farm">
                        <Farm />
                      </Route>
                      <Route path="/risky-troves">
                        <RiskyTrovesPage />
                      </Route>
                      <Route path="/redemption">
                        <RedemptionPage />
                      </Route>
                    </Switch>
                  </Container>
                </Flex>
              </FarmViewProvider>
            </StakingViewProvider>
          </StabilityViewProvider>
        </TroveViewProvider>
      </Router>
      <TransactionMonitor />
    </GivetyStoreProvider>
  );
};
