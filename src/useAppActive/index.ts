import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Called when the application from background to foreground
 * @public
 */
export function useAppActive(fn: () => void): void {
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') {
      fn();
    }
  };

  useEffect(() => {
    const subscribe = AppState.addEventListener('change', onChange);

    return () => subscribe.remove();
  }, []);
}
