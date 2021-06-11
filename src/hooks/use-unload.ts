import { EffectCallback, useEffect } from 'react';

/**
 * 页面销毁时执行
 * @public
 */
export default (effect: EffectCallback): void => {
  useEffect(() => {
    return () => {
      effect();
    };
  }, []);
};
