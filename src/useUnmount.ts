import { useEffect } from 'react';

/**
 * Called when the component is unmounted
 * @public
 */
export function useUnmount(fn: () => void): void {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}
