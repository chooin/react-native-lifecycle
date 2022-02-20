import { useEffect } from 'react';

/**
 * 页面销毁时执行
 * @public
 */
export function useUnload(fn: () => void): void {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}
