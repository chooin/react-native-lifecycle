import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Called when the app returns to the foreground (AppState becomes `active`)
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
