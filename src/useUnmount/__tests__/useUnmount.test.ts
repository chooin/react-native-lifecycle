import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnmount } from '../index';

describe('useUnmount', () => {
  it('test useUnmount', async () => {
    const fn = vi.fn();
    const hook = renderHook(() => useUnmount(fn));
    expect(fn).toHaveBeenCalledTimes(0);
    hook.rerender();
    expect(fn).toHaveBeenCalledTimes(0);
    hook.unmount();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
