import { useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * 页面尺寸变化时执行
 * @public
 */
export default (fn: () => void): void => {
  const onChange = () => {
    fn();
  };

  useEffect(() => {
    const unsubscribe = Dimensions.addEventListener('change', onChange);

    return () => unsubscribe.remove();
  }, []);
};
