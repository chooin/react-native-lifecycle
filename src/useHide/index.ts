import { useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Called when the screen loses focus or unmounts, or when the app leaves the foreground while the screen is focused
 */
export function useHide(fn: () => void): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener(
        'change',
        (state: AppStateStatus) => {
          if (
            state ===
            Platform.select({
              ios: 'inactive',
              android: 'background',
            })
          ) {
            fnRef.current();
          }
        },
      );

      return () => {
        subscription.remove();
        fnRef.current();
      };
    }, []),
  );
}
