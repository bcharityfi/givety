import { useContext } from "react";

import { GivetyStore } from "givety-lib-base";

import { GivetyStoreContext } from "../components/GivetyStoreProvider";

export const useGivetyStore = <T>(): GivetyStore<T> => {
  const store = useContext(GivetyStoreContext);

  if (!store) {
    throw new Error("You must provide a GivetyStore via GivetyStoreProvider");
  }

  return store as GivetyStore<T>;
};
