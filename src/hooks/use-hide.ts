import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * 页面从前台变为后台时执行
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  // ? App 页面被隐藏触发事件
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', effect);

    return unsubscribe;
  }, [navigation]);

  // ? App 从前台切换到后台触发事件
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
