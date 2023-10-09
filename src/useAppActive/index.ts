import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Called when the application switches from the background to the foreground
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
