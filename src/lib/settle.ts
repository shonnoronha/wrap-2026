import { createContext, useContext, useEffect, useRef } from 'react';

/**
 * Each page tells the player when its entrance animation has finished.
 * The player only starts the page's reading timer (dwellMs) after that,
 * so auto-advance never cuts an animation short.
 *
 * On Android the same signal comes from the Rive state machine reaching its
 * "settled" state.
 */
export const SettleContext = createContext<() => void>(() => {});

/** Returns a function the page calls once its animation is done. */
export const useSettle = () => useContext(SettleContext);

/** For pages whose animation is a fixed timeline: settle after `ms`. */
export function useSettleAfter(ms: number) {
  const settle = useRef(useSettle());
  useEffect(() => {
    const id = window.setTimeout(() => settle.current(), ms);
    return () => clearTimeout(id);
  }, [ms]);
}
