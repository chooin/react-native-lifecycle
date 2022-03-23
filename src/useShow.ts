import { useEffect, useRef } from 'react';
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
export function useShow(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<NativeEventSubscription | null>(null);
  const isAppStateChangeRef = useRef(false);

  const onChange = (state: AppStateStatus) => {
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
  };

  useEffect(() => {
    const subscribe = navigation.addListener('focus', () => {
      AppStateRef.current = AppState.addEventListener('change', onChange);
    });

    return subscribe;
  }, [navigation]);

  useEffect(() => {
    const subscribe = navigation.addListener('blur', () => {
      AppStateRef.current?.remove?.();
    });

    return subscribe;
  }, [navigation]);

  useEffect(() => {
    const subscribe = navigation.addListener('focus', () => {
      if (isAppStateChangeRef.current) {
        isAppStateChangeRef.current = false;
      } else {
        fn();
      }
    });

    return subscribe;
  }, [navigation]);
}
