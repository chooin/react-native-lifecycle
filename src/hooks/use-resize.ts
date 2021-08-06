import { useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * 页面尺寸变化时执行
 * @public
 */
export default (fn: () => void) => {
  const onChange = () => {
    fn();
  };

  useEffect(() => {
    Dimensions.addEventListener('change', onChange);

    return () => Dimensions.removeEventListener('change', onChange);
  }, []);
};
