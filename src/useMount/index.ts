import { useEffect } from 'react';

/**
 * Called when the component is mounted
 * @public
 */
export function useMount(fn: () => void): void {
  useEffect(() => {
    fn();
  }, []);
}
