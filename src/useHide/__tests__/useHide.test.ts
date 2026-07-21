import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useHide } from '../index';
import { renderHook } from '@testing-library/react-hooks';

// The state that means "the app left the foreground" on the current platform
const backgroundState = Platform.select({
  ios: 'inactive',
  android: 'background',
}) as AppStateStatus;

type NavigationListener = () => void;

let navListeners: Record<'focus' | 'blur', NavigationListener[]>;
let isScreenFocused: boolean;

// Minimal navigation object satisfying what useFocusEffect needs
const navigation = {
  isFocused: () => isScreenFocused,
  addListener: (event: 'focus' | 'blur', listener: NavigationListener) => {
    navListeners[event].push(listener);
    return () => {
      navListeners[event] = navListeners[event].filter(l => l !== listener);
    };
  },
};

const wrapper = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(
    NavigationContext.Provider,
    { value: navigation as never },
    children,
  );

const emitNavigation = (event: 'focus' | 'blur') => {
  isScreenFocused = event === 'focus';
  [...navListeners[event]].forEach(listener => listener());
};

let appStateHandlers: Array<(state: AppStateStatus) => void> = [];

const emitAppStateChange = (state: AppStateStatus) => {
  [...appStateHandlers].forEach(handler => handler(state));
};

describe('useHide', () => {
  beforeEach(() => {
    navListeners = { focus: [], blur: [] };
    isScreenFocused = false;
    appStateHandlers = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: (state: AppStateStatus) => void,
    ) => {
      appStateHandlers.push(handler);
      return {
        remove: () => {
          appStateHandlers = appStateHandlers.filter(h => h !== handler);
        },
      };
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(useHide).toBeDefined();
  });

  it('calls fn every time the screen loses focus', () => {
    const fn = jest.fn();
    renderHook(() => useHide(fn), { wrapper });
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(0);
    emitNavigation('blur');
    expect(fn).toBeCalledTimes(1);
    emitNavigation('focus');
    emitNavigation('blur');
    expect(fn).toBeCalledTimes(2);
  });

  it('calls fn when the app leaves the foreground while the screen is focused', () => {
    const fn = jest.fn();
    renderHook(() => useHide(fn), { wrapper });
    emitNavigation('focus');
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(2);
  });

  it('ignores AppState changes while the screen is blurred', () => {
    const fn = jest.fn();
    renderHook(() => useHide(fn), { wrapper });
    emitNavigation('focus');
    // blur removes the AppState subscription and itself counts as one hide
    emitNavigation('blur');
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
  });

  it('calls fn once when unmounted while focused and stops listening afterwards', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useHide(fn), { wrapper });
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(0);
    hook.unmount();
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
  });

  it('does not call fn again when unmounted after losing focus', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useHide(fn), { wrapper });
    emitNavigation('focus');
    emitNavigation('blur');
    expect(fn).toBeCalledTimes(1);
    hook.unmount();
    expect(fn).toBeCalledTimes(1);
  });
});
