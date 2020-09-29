import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面从前台变为后台时执行
 */
export default (effect: EffectCallback): void => {
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
      effect();
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
    const unsubscribe = navigation.addListener('blur', effect);

    return unsubscribe;
  }, [navigation]);
};
