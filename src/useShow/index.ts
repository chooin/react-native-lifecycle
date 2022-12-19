import { useEffect, useRef, useCallback } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Called when the page is displayed or in the application from background to foreground
 * @public
 */
export default function useShow(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<NativeEventSubscription>();
  const isAppStateChangeRef = useRef(false);

  const onChange = useCallback(
    (state: AppStateStatus) => {
      if (isAppStateChangeRef.current) {
        if (state === 'active') {
          fn();
        }
      }
      if (
        state ===
        Platform.select({
          ios: 'inactive',
          android: 'background',
        })
      ) {
        isAppStateChangeRef.current = true;
      }
    },
    [fn],
  );

  useEffect(() => {
    return navigation.addListener('focus', () => {
      AppStateRef.current = AppState.addEventListener('change', onChange);
    });
  }, [navigation, onChange]);

  useEffect(() => {
    return navigation.addListener('blur', () => {
      AppStateRef.current?.remove?.();
    });
  }, [navigation]);
  useEffect(() => {
    return navigation.addListener('focus', () => {
      if (isAppStateChangeRef.current) {
        isAppStateChangeRef.current = false;
      } else {
        fn();
      }
    });
  }, [navigation, fn]);
}
