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
export default (fn: () => void): void => {
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
    const unsubscribe = navigation.addListener('focus', () => {
      AppStateRef.current = AppState.addEventListener('change', onChange);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      AppStateRef.current?.remove?.();
    });

    return unsubscribe;
  }, [navigation]);

  // ? 页面从前台变为后台时执行
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', fn);

    return unsubscribe;
  }, [navigation]);
};
