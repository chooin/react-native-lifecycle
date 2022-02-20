import { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面出现在前台时执行
 * @public
 */
export function useShow(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<EmitterSubscription | null>(null);
  const isAppStateChangeRef = useRef(false);

  // ? App 从后台变为前台时执行
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

  // ? 页面出现在前台时执行
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
