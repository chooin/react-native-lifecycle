import { useEffect } from 'react';

/**
 * Called once when the component is mounted
 */
export function useMount(fn: () => void): void {
  useEffect(() => {
    fn();
  }, []);
}
