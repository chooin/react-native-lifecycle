import { Dimensions } from 'react-native';
import { useResize } from '../index';
import { renderHook } from '@testing-library/react-hooks';

let handlers: Array<() => void> = [];

const emitDimensionsChange = () => {
  [...handlers].forEach(handler => handler());
};

describe('useResize', () => {
  beforeEach(() => {
    handlers = [];
    jest.spyOn(Dimensions, 'addEventListener').mockImplementation(((
      _type: string,
      handler: () => void,
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
    expect(useResize).toBeDefined();
  });

  it('calls fn every time the window dimensions change', () => {
    const fn = jest.fn();
    renderHook(() => useResize(fn));
    expect(fn).toBeCalledTimes(0);
    emitDimensionsChange();
    expect(fn).toBeCalledTimes(1);
    emitDimensionsChange();
    expect(fn).toBeCalledTimes(2);
  });

  it('removes the Dimensions listener on unmount', () => {
    const fn = jest.fn();
    const hook = renderHook(() => useResize(fn));
    hook.unmount();
    emitDimensionsChange();
    expect(fn).toBeCalledTimes(0);
  });
});
