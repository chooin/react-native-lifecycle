import * as React from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useShow } from '../index';
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

describe('useShow', () => {
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
    expect(useShow).toBeDefined();
  });

  it('calls fn every time the screen gains focus', () => {
    const fn = jest.fn();
    renderHook(() => useShow(fn), { wrapper });
    expect(fn).toBeCalledTimes(0);
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(1);
    emitNavigation('blur');
    expect(fn).toBeCalledTimes(1);
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(2);
  });

  it('calls fn immediately when mounted on an already-focused screen', () => {
    const fn = jest.fn();
    isScreenFocused = true;
    renderHook(() => useShow(fn), { wrapper });
    expect(fn).toBeCalledTimes(1);
  });

  it('calls fn when the app returns to the foreground while the screen is focused', () => {
    const fn = jest.fn();
    renderHook(() => useShow(fn), { wrapper });
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(2);
  });

  it('does not miss the next focus after a background/foreground cycle', () => {
    const fn = jest.fn();
    renderHook(() => useShow(fn), { wrapper });
    emitNavigation('focus');
    emitAppStateChange(backgroundState);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(2);
    emitNavigation('blur');
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(3);
  });

  it('ignores AppState changes while the screen is blurred', () => {
    const fn = jest.fn();
    renderHook(() => useShow(fn), { wrapper });
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(1);
    // blur removes the AppState subscription
    emitNavigation('blur');
    emitAppStateChange(backgroundState);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(1);
  });

  it('removes the AppState subscription when unmounted while focused', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useShow(fn), { wrapper });
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(1);
    hook.unmount();
    emitAppStateChange(backgroundState);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(1);
  });

  it('removes the navigation listeners on unmount', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useShow(fn), { wrapper });
    hook.unmount();
    emitNavigation('focus');
    expect(fn).toBeCalledTimes(0);
  });
});
