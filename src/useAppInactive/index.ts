import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * Called when the application from foreground to background
 * @public
 */
export default function useAppInactive(fn: () => void): void {
  const onChange = (state: AppStateStatus) => {
    if (
      state ===
      Platform.select({
        ios: 'inactive',
        android: 'background',
      })
    ) {
      fn();
    }
  };

  useEffect(() => {
    const subscribe = AppState.addEventListener('change', onChange);

    return () => subscribe.remove();
  }, []);
}
