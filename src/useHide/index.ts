import { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Called when the page is hidden, or when the application switches from the foreground to the background.
 * @public
 */
export function useHide(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<NativeEventSubscription>();

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
    return navigation.addListener('focus', () => {
      AppStateRef.current = AppState.addEventListener('change', onChange);
    });
  }, [navigation]);

  useEffect(() => {
    return navigation.addListener('blur', () => {
      AppStateRef.current?.remove?.();
    });
  }, [navigation]);

  useEffect(() => {
    return navigation.addListener('blur', fn);
  }, [navigation]);
}
