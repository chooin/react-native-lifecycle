import { useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * Called after the page window resize
 * @public
 */
export function useResize(fn: () => void): void {
  const onChange = () => {
    fn();
  };

  useEffect(() => {
    const subscribe = Dimensions.addEventListener('change', onChange);

    return () => subscribe.remove();
  }, []);
}
