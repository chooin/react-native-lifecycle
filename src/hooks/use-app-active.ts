import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App 从后台变为前台时执行
 * @public
 */
export default (fn: () => void): void => {
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') {
      fn();
    }
  };

  useEffect(() => {
    const subscribe = AppState.addEventListener('change', onChange);

    return () => subscribe.remove();
  }, []);
};
