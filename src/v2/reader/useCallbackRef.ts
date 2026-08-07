import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Return a stable function identity that always calls the latest `callback`. Lets an effect
 * that binds long-lived DOM listeners (the reader's pointer-drag handlers) depend on the
 * callback without re-binding on every render, while never calling a stale closure.
 */
export function useCallbackRef<Args extends unknown[], R>(
  callback: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}
