import { useEffect, useReducer } from "react";

import { GivetyStoreState } from "givety-lib-base";

import { equals } from "../utils/equals";
import { useGivetyStore } from "./useGivetyStore";

export const useGivetySelector = <S, T>(select: (state: GivetyStoreState<T>) => S): S => {
  const store = useGivetyStore<T>();
  const [, rerender] = useReducer(() => ({}), {});

  useEffect(
    () =>
      store.subscribe(({ newState, oldState }) => {
        if (!equals(select(newState), select(oldState))) {
          rerender();
        }
      }),
    [store, select]
  );

  return select(store.state);
};
