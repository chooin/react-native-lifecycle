import { useEffect } from 'react';

/**
 * 页面创建时执行
 * @public
 */
export default (fn: () => void) => {
  useEffect(() => {
    fn();
  }, []);
};
