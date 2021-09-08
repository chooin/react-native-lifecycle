import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面出现在前台时执行
 * @public
 */
export default (fn: () => void): void => {
  const navigation = useNavigation();
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
    const unsubscribe = navigation.addListener('focus', () => {
      AppState.addEventListener('change', onChange);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      AppState.removeEventListener('change', onChange);
    });

    return unsubscribe;
  }, [navigation]);

  // ? 页面出现在前台时执行
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAppStateChangeRef.current) {
        isAppStateChangeRef.current = false;
      } else {
        fn();
      }
    });

    return unsubscribe;
  }, [navigation]);
};
