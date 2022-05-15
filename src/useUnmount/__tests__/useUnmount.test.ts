import { index } from '../index';
import { renderHook } from '@testing-library/react-hooks';

describe('index', () => {
  it('should be defined', () => {
    expect(index).toBeDefined();
  });
  it('test index', async () => {
    const fn = jest.fn();
    const hook = renderHook(() => index(fn));
    expect(fn).toBeCalledTimes(0);
    hook.rerender();
    expect(fn).toBeCalledTimes(0);
    hook.unmount();
    expect(fn).toBeCalledTimes(1);
  });
});
