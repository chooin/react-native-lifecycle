import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * App 从前台变为后台时执行
 * @public
 */
export default (fn: () => void): void => {
  const onChange = (state: AppStateStatus) => {
    if (
      state ===
      Platform.select({
        ios: 'inactive',
        android: 'background',
      })
    ) {
      fn();
    }
  };

  useEffect(() => {
    AppState.addEventListener('change', onChange);

    return () => AppState.removeEventListener('change', onChange);
  }, []);
};
