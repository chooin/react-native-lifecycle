import { useUnmount } from '../';
import { renderHook } from '@testing-library/react';

describe('useUnmount', () => {
  it('should be defined', () => {
    expect(useUnmount).toBeDefined();
  });
  // it('test useUnmount', async () => {
  //   const fn = jest.fn();
  //   const hook = renderHook(() => useUnmount(fn));
  //   expect(fn).toBeCalledTimes(0);
  //   hook.rerender();
  //   expect(fn).toBeCalledTimes(0);
  //   hook.unmount();
  //   expect(fn).toBeCalledTimes(1);
  // });
});
