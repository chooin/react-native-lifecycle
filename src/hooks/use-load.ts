import { EffectCallback, useEffect } from 'react';

/**
 * 页面创建时执行
 * @public
 */
export default (effect: EffectCallback) => {
  useEffect(effect, []);
};
