import { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Called when the page is hidden or in the application from foreground to background
 * @public
 */
export function useHide(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<EmitterSubscription | null>(null);

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

  // ? 页面从前台变为后台时执行
  useEffect(() => {
    const subscribe = navigation.addListener('blur', fn);

    return subscribe;
  }, [navigation]);
}
