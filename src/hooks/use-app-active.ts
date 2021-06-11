import { EffectCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App 从后台变为前台时执行
 * @public
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
