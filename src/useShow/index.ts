import { useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Called when the screen gains focus, or when the app returns to the foreground while the screen is focused
 */
export function useShow(fn: () => void): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useFocusEffect(
    useCallback(() => {
      fnRef.current();

      let hasLeftForeground = false;
      const subscription = AppState.addEventListener(
        'change',
        (state: AppStateStatus) => {
          if (hasLeftForeground && state === 'active') {
            hasLeftForeground = false;
            fnRef.current();
          }
          if (
            state ===
            Platform.select({
              ios: 'inactive',
              android: 'background',
            })
          ) {
            hasLeftForeground = true;
          }
        },
      );

      return () => subscription.remove();
    }, []),
  );
}
