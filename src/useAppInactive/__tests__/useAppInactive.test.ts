import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAppInactive } from '../index';
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

describe('useAppInactive', () => {
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
    expect(useAppInactive).toBeDefined();
  });

  it('calls fn every time the app leaves the foreground', () => {
    const fn = jest.fn();
    renderHook(() => useAppInactive(fn));
    expect(fn).toBeCalledTimes(0);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange('active');
    expect(fn).toBeCalledTimes(1);
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(2);
  });

  it('removes the AppState listener on unmount', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useAppInactive(fn));
    hook.unmount();
    emitAppStateChange(backgroundState);
    expect(fn).toBeCalledTimes(0);
  });
});
