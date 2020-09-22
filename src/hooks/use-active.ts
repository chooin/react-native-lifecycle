import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App 从后台变成前台运行
 */
export default (effect: EffectCallback): void => {
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
