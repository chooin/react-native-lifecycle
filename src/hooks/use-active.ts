import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * App 从后台变为前台时执行（方法执行后只有执行过该方法的页面且满足条件才会再次执行）
 */
export default (effect: EffectCallback): void => {
  const navigation = useNavigation();

  const onChange = (state: AppStateStatus) => {
    if (state === 'active') {
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
};
