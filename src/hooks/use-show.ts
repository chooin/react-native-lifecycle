import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面或 APP 出现在前台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  // ? App 页面被展示触发事件
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', effect);

    return unsubscribe;
  }, [navigation]);

  // ? App 从后台切换至前台触发事件
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
