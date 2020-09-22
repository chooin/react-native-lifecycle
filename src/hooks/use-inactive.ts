import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App 从前台变为后台运行
 */
export default (effect: EffectCallback): void => {
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
