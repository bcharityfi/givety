import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Provider } from "@ethersproject/abstract-provider";
import { getNetwork } from "@ethersproject/networks";
import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";

import { isBatchedProvider, isWebSocketAugmentedProvider } from "givety-providers";
import {
  BlockPolledGivetyStore,
  EthersGivety,
  EthersGivetyWithStore,
  _connectByChainId
} from "@givety/lib-ethers";

import { GivetyFrontendConfig, getConfig } from "../config";

type GivetyContextValue = {
  config: GivetyFrontendConfig;
  account: string;
  provider: Provider;
  givety: EthersGivetyWithStore<BlockPolledGivetyStore>;
};

const GivetyContext = createContext<GivetyContextValue | undefined>(undefined);

type GivetyProviderProps = {
  loader?: React.ReactNode;
  unsupportedNetworkFallback?: (chainId: number) => React.ReactNode;
  unsupportedMainnetFallback?: React.ReactNode;
};

const wsParams = (network: string, infuraApiKey: string): [string, string] => [
  `wss://${network === "homestead" ? "mainnet" : network}.infura.io/ws/v3/${infuraApiKey}`,
  network
];

const supportedNetworks = ["homestead", "kovan", "rinkeby", "ropsten", "goerli"];

export const GivetyProvider: React.FC<GivetyProviderProps> = ({
  children,
  loader,
  unsupportedNetworkFallback,
  unsupportedMainnetFallback
}) => {
  const { library: provider, account, chainId } = useWeb3React<Web3Provider>();
  const [config, setConfig] = useState<GivetyFrontendConfig>();

  const connection = useMemo(() => {
    if (config && provider && account && chainId) {
      try {
        return _connectByChainId(provider, provider.getSigner(account), chainId, {
          userAddress: account,
          frontendTag: config.frontendTag,
          useStore: "blockPolled"
        });
      } catch {}
    }
  }, [config, provider, account, chainId]);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config && connection) {
      const { provider, chainId } = connection;

      if (isBatchedProvider(provider) && provider.chainId !== chainId) {
        provider.chainId = chainId;
      }

      if (isWebSocketAugmentedProvider(provider)) {
        const network = getNetwork(chainId);

        if (network.name && supportedNetworks.includes(network.name) && config.infuraApiKey) {
          provider.openWebSocket(...wsParams(network.name, config.infuraApiKey));
        } else if (connection._isDev) {
          provider.openWebSocket(`ws://${window.location.hostname}:8546`, chainId);
        }

        return () => {
          provider.closeWebSocket();
        };
      }
    }
  }, [config, connection]);

  if (!config || !provider || !account || !chainId) {
    return <>{loader}</>;
  }

  if (config.testnetOnly && chainId === 1) {
    return <>{unsupportedMainnetFallback}</>;
  }

  if (!connection) {
    return unsupportedNetworkFallback ? <>{unsupportedNetworkFallback(chainId)}</> : null;
  }

  const givety = EthersGivety._from(connection);
  givety.store.logging = true;

  return (
    <GivetyContext.Provider value={{ config, account, provider, givety }}>
      {children}
    </GivetyContext.Provider>
  );
};

export const useGivety = () => {
  const givetyContext = useContext(GivetyContext);

  if (!givetyContext) {
    throw new Error("You must provide a GivetyContext via GivetyProvider");
  }

  return givetyContext;
};
