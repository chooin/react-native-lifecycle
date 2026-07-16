import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __dimensionsListenerCount,
  __emitDimensions,
} from '../../../test/mocks/react-native';
import { useResize } from '../index';

describe('useResize', () => {
  it('尺寸变化时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useResize(fn));

    __emitDimensions();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('卸载后摘除监听器', () => {
    const fn = vi.fn();
    const hook = renderHook(() => useResize(fn));
    expect(__dimensionsListenerCount()).toBe(1);

    hook.unmount();

    expect(__dimensionsListenerCount()).toBe(0);
    __emitDimensions();
    expect(fn).not.toHaveBeenCalled();
  });
});
