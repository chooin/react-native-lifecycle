import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面从前台变为后台时执行
 * @public
 */
export default (fn: () => void): void => {
  const navigation = useNavigation();

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

  // ? 页面从前台变为后台时执行
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', fn);

    return unsubscribe;
  }, [navigation]);
};
