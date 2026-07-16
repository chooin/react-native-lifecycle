import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { __emitBlur, __emitFocus } from '../../../test/mocks/react-navigation';
import { useShow } from '../index';

describe('useShow', () => {
  it('页面 focus 时调用 fn', () => {
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('从后台返回时不重复触发 —— AppState 与 navigation focus 只算一次', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus(); // 首次进入页面
    expect(fn).toHaveBeenCalledTimes(1);

    __emitAppState('inactive'); // 进入后台,置位 isAppStateChangeRef
    __emitAppState('active'); // 恢复前台 —— 由 AppState 路径负责这次调用
    expect(fn).toHaveBeenCalledTimes(2);

    // 真机上紧随其后还会来一个 navigation focus。
    // isAppStateChangeRef 必须让它被识别为 resume 而跳过。
    __emitFocus();

    // 若去重逻辑被破坏,这里会是 3。
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('blur 后摘除 AppState 监听器', () => {
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus();
    expect(__appStateListenerCount()).toBe(1);

    __emitBlur();

    expect(__appStateListenerCount()).toBe(0);
  });
});
