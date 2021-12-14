import { useEffect, useState } from "react";
import { AddressZero } from "@ethersproject/constants";

import { GivetyStoreState } from "givety-lib-base";
import { useGivetySelector } from "givety-lib-react";

import { useGivety } from "../hooks/GivetyContext";

import { Dashboard } from "./Dashboard";
import { UnregisteredFrontend } from "./UnregisteredFrontend";
import { FrontendRegistration } from "./FrontendRegistration";
import { FrontendRegistrationSuccess } from "./FrontendRegistrationSuccess";

const selectFrontend = ({ frontend }: GivetyStoreState) => frontend;

export const PageSwitcher: React.FC = () => {
  const {
    account,
    config: { frontendTag }
  } = useGivety();

  const frontend = useGivetySelector(selectFrontend);
  const unregistered = frontendTag !== AddressZero && frontend.status === "unregistered";

  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (unregistered) {
      setRegistering(true);
    }
  }, [unregistered]);

  if (registering || unregistered) {
    if (frontend.status === "registered") {
      return <FrontendRegistrationSuccess onDismiss={() => setRegistering(false)} />;
    } else if (account === frontendTag) {
      return <FrontendRegistration />;
    } else {
      return <UnregisteredFrontend />;
    }
  } else {
    return <Dashboard />;
  }
};
