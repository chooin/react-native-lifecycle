import { useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * 页面尺寸变化时执行
 * @public
 */
export function useResize(fn: () => void): void {
  const onChange = () => {
    fn();
  };

  useEffect(() => {
    const subscribe = Dimensions.addEventListener('change', onChange);

    return () => subscribe.remove();
  }, []);
}
