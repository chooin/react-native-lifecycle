import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
} from '../../../test/mocks/react-native';
import { useAppActive } from '../index';

describe('useAppActive', () => {
  it('回到前台时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useAppActive(fn));

    __emitAppState('active');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('非 active 状态不调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useAppActive(fn));

    __emitAppState('background');
    __emitAppState('inactive');

    expect(fn).not.toHaveBeenCalled();
  });

  it('卸载后摘除监听器', () => {
    const fn = vi.fn();
    const hook = renderHook(() => useAppActive(fn));
    expect(__appStateListenerCount()).toBe(1);

    hook.unmount();

    expect(__appStateListenerCount()).toBe(0);
    __emitAppState('active');
    expect(fn).not.toHaveBeenCalled();
  });
});
