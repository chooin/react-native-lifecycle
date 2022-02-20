import { useEffect } from 'react';

/**
 * Called when the page load
 * @public
 */
export function useLoad(fn: () => void): void {
  useEffect(() => {
    fn();
  }, []);
}
