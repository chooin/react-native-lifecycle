import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAppActive } from '../index';
import { renderHook } from '@testing-library/react-hooks';

// The state that means "the app left the foreground" on the current platform
const backgroundState = Platform.select({
  ios: 'inactive',
  android: 'background',
}) as AppStateStatus;

let handlers: Array<(state: AppStateStatus) => void> = [];

const emitAppStateChange = (state: AppStateStatus) => {
  [...handlers].forEach(handler => handler(state));
};

describe('useAppActive', () => {
  beforeEach(() => {
    handlers = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _type: string,
      handler: (state: AppStateStatus) => void,
    ) => {
      handlers.push(handler);
      return {
        remove: () => {
          handlers = handlers.filter(h => h !== handler);
        },
      };
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(useAppActive).toBeDefined();
  });

  it('calls fn every time the app returns to the foreground', () => {
    const fn = jest.fn();
    renderHook(() => useAppActive(fn));
    expect(fn).toBeCalledTimes(0);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(2);
  });

  it('removes the AppState listener on unmount', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useAppActive(fn));
    hook.unmount();
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(0);
  });
});
