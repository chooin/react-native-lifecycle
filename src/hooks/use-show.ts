import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面或 APP 出现在前台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  // ? 页面出现在前台时执行
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', effect);

    return unsubscribe;
  }, [navigation]);

  // ? APP 出现在前台时执行
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') {
      effect();
    }
  };

  useEffect(() => {
    AppState.addEventListener('change', onChange);

    return () => AppState.removeEventListener('change', onChange);
  }, []);
};
