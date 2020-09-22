import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面或 App 从前台变为后台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  // ? 页面从前台变为后台时执行
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', effect);

    return unsubscribe;
  }, [navigation]);

  // ? App 从前台变为后台时执行
  const onChange = (state: AppStateStatus) => {
    if (state !== 'active') {
      effect();
    }
  };

  useEffect(() => {
    AppState.addEventListener('change', onChange);

    return () => AppState.removeEventListener('change', onChange);
  }, []);
};
