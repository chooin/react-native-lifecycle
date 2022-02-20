import { useEffect } from 'react';

/**
 * Called when the page is unloaded
 * @public
 */
export function useUnload(fn: () => void): void {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}
