import { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面从前台变为后台时执行
 * @public
 */
export function useHide(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<EmitterSubscription | null>(null);

  // ? App 从前台变为后台时执行
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
