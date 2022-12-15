import { useEffect } from 'react';

/**
 * Called when the component is unmounted
 * @public
 */
export default function useUnmount(fn: () => void): void {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}
