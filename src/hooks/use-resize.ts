import { useEffect, EffectCallback } from 'react';
import { Dimensions } from 'react-native';

/**
 * 页面尺寸变化时执行
 */
export default (effect: EffectCallback) => {
  const onChange = () => {
    effect();
  };

  useEffect(() => {
    Dimensions.addEventListener('change', onChange);

    return () => Dimensions.removeEventListener('change', onChange);
  }, []);
};
