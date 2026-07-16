import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  __emitAppState,
  __setPlatform,
} from '../../../test/mocks/react-native';
import { useAppInactive } from '../index';

describe('useAppInactive', () => {
  it('ios 上 inactive 触发、background 不触发', () => {
    __setPlatform('ios');
    const fn = vi.fn();
    renderHook(() => useAppInactive(fn));

    __emitAppState('background');
    expect(fn).not.toHaveBeenCalled();

    __emitAppState('inactive');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('android 上 background 触发、inactive 不触发', () => {
    __setPlatform('android');
    const fn = vi.fn();
    renderHook(() => useAppInactive(fn));

    __emitAppState('inactive');
    expect(fn).not.toHaveBeenCalled();

    __emitAppState('background');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
