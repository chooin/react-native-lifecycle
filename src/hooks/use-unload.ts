import { EffectCallback, useEffect } from 'react';

/**
 * 页面销毁时执行
 */
export default (effect: EffectCallback): void => {
  useEffect(() => {
    return effect();
  }, []);
};
