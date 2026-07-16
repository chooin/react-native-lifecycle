import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { __emitBlur, __emitFocus } from '../../../test/mocks/react-navigation';
import { useHide } from '../index';

describe('useHide', () => {
  it('页面 blur 时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitBlur();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ios 上 focus 后进入后台(inactive)调用 fn', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    // 必须先 focus —— AppState 监听器是在 focus 时才挂载的
    __emitFocus();
    __emitAppState('inactive');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('android 上 focus 后进入后台(background)调用 fn', () => {
    __setPlatform('android');
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitFocus();
    __emitAppState('background');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('blur 后摘除 AppState 监听器', () => {
    const fn = vi.fn();
    renderHook(() => useHide(fn));

    __emitFocus();
    expect(__appStateListenerCount()).toBe(1);

    __emitBlur();

    expect(__appStateListenerCount()).toBe(0);
  });
});
