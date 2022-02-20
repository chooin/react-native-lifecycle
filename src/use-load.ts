import { useEffect } from 'react';

/**
 * 页面创建时执行
 * @public
 */
export function useLoad(fn: () => void): void {
  useEffect(() => {
    fn();
  }, []);
}
