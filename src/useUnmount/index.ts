import { useEffect } from 'react';

/**
 * Called once when the component is unmounted
 */
export function useUnmount(fn: () => void): void {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}
