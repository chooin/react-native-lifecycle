import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __appStateListenerCount,
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import {
  __emitBlur,
  __emitFocus,
  __setFocused,
} from '../../../test/mocks/react-navigation';
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

    // 标志位被 resume 消费后必须复位:此后一次普通的离开→回来要照常触发。
    // 若删掉 useShow/index.ts:51 的复位,这里会停在 2。
    __emitBlur();
    __emitFocus();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('未经后台的 AppState active 不触发 —— 该次进入只算 focus 一次', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus(); // fn 第 1 次
    __emitAppState('active'); // 没先进入后台,不是 resume,不该再触发

    expect(fn).toHaveBeenCalledTimes(1); // 删掉 index.ts:20 的 gate 会是 2
  });

  it('blur 后摘除 AppState 监听器', () => {
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus();
    expect(__appStateListenerCount()).toBe(1);

    __emitBlur();

    expect(__appStateListenerCount()).toBe(0);
  });

  it('卸载后摘除 AppState 监听器 —— focus 状态下直接卸载时 blur 不会到来', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    const hook = renderHook(() => useShow(fn));

    __emitFocus(); // fn 第 1 次
    expect(__appStateListenerCount()).toBe(1);

    hook.unmount();

    expect(__appStateListenerCount()).toBe(0);
    __emitAppState('inactive');
    __emitAppState('active');
    expect(fn).toHaveBeenCalledTimes(1); // 已卸载,不应再被触发
  });

  it('连续 focus 不重复挂载监听器 —— 多轮后台返回不累积触发', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    __emitFocus(); // fn 第 1 次
    __emitAppState('inactive');
    __emitAppState('active'); // fn 第 2 次
    __emitFocus(); // resume 后的 focus,被去重跳过

    expect(__appStateListenerCount()).toBe(1);

    __emitAppState('inactive');
    __emitAppState('active'); // fn 第 3 次

    expect(fn).toHaveBeenCalledTimes(3); // 重复挂载时会是 4
  });

  it('挂载时屏幕已处于 focus —— 不等 focus 事件就挂载监听器', () => {
    __setFocused(true);
    const fn = vi.fn();
    renderHook(() => useShow(fn));

    // 已经 focused 时不会再有 focus 事件到来,若只在事件里挂载就永远收不到 AppState
    expect(__appStateListenerCount()).toBe(1);

    __setPlatform('ios');
    __emitAppState('inactive');
    __emitAppState('active');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
