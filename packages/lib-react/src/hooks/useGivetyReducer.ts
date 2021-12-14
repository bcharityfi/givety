import { useCallback, useEffect, useReducer, useRef } from "react";

import { GivetyStoreState } from "givety-lib-base";

import { equals } from "../utils/equals";
import { useGivetyStore } from "./useGivetyStore";

export type GivetyStoreUpdate<T = unknown> = {
  type: "updateStore";
  newState: GivetyStoreState<T>;
  oldState: GivetyStoreState<T>;
  stateChange: Partial<GivetyStoreState<T>>;
};

export const useGivetyReducer = <S, A, T>(
  reduce: (state: S, action: A | GivetyStoreUpdate<T>) => S,
  init: (storeState: GivetyStoreState<T>) => S
): [S, (action: A | GivetyStoreUpdate<T>) => void] => {
  const store = useGivetyStore<T>();
  const oldStore = useRef(store);
  const state = useRef(init(store.state));
  const [, rerender] = useReducer(() => ({}), {});

  const dispatch = useCallback(
    (action: A | GivetyStoreUpdate<T>) => {
      const newState = reduce(state.current, action);

      if (!equals(newState, state.current)) {
        state.current = newState;
        rerender();
      }
    },
    [reduce]
  );

  useEffect(() => store.subscribe(params => dispatch({ type: "updateStore", ...params })), [
    store,
    dispatch
  ]);

  if (oldStore.current !== store) {
    state.current = init(store.state);
    oldStore.current = store;
  }

  return [state.current, dispatch];
};
