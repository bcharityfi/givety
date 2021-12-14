import { GivetyStore } from "givety-lib-base";
import React, { createContext, useEffect, useState } from "react";

export const GivetyStoreContext = createContext<GivetyStore | undefined>(undefined);

type GivetyStoreProviderProps = {
  store: GivetyStore;
  loader?: React.ReactNode;
};

export const GivetyStoreProvider: React.FC<GivetyStoreProviderProps> = ({
  store,
  loader,
  children
}) => {
  const [loadedStore, setLoadedStore] = useState<GivetyStore>();

  useEffect(() => {
    store.onLoaded = () => setLoadedStore(store);
    const stop = store.start();

    return () => {
      store.onLoaded = undefined;
      setLoadedStore(undefined);
      stop();
    };
  }, [store]);

  if (!loadedStore) {
    return <>{loader}</>;
  }

  return <GivetyStoreContext.Provider value={loadedStore}>{children}</GivetyStoreContext.Provider>;
};
