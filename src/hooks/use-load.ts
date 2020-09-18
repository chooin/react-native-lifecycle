import { EffectCallback, useEffect } from 'react';

/**
 * 页面创建时执行
 */
export default (effect: EffectCallback) => {
  useEffect(effect, []);
};
