import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App 从前台变为后台时执行（方法执行后只有满足条件才会再次执行）
 */
export default (effect: EffectCallback): void => {
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
