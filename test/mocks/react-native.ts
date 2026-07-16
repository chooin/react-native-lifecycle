/**
 * react-native 的受控替身,取代运行时的真包。
 *
 * 真 react-native 发布的是 Flow 源码,esbuild 解析不了;而且在测试环境里真的
 * AppState 永远不会 emit 任何事件。本库从不渲染 RN 组件,只订阅 AppState 与
 * Dimensions,因此整包替换。类型仍走真包 —— tsc 读的是真 .d.ts。
 *
 * 只实现本库真正调用到的 API。面越小,替身与真 RN 漂移的风险越低。
 */

export type AppStateStatus =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'
  | 'extension';

export interface NativeEventSubscription {
  remove(): void;
}

export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface DimensionsChange {
  window: ScaledSize;
  screen: ScaledSize;
}

type PlatformOS = 'ios' | 'android';

interface PlatformSelectSpec<T> {
  ios?: T;
  android?: T;
  native?: T;
  default?: T;
}

interface Registration<T> {
  listener: (value: T) => void;
}

function createEmitter<T>() {
  // 每次注册产生一个独立的 registration,remove() 只摘自己那一个 —— 真 RN 的
  // EventEmitter 就是这个语义。若改用引用相等过滤,同一个函数引用注册两次时
  // 一次 remove() 会把两个都误删,替身就比真 RN 更宽容,恰好会掩盖 useShow
  // 重复挂载监听器的真 bug。
  let registrations: Array<Registration<T>> = [];

  return {
    add(listener: (value: T) => void): NativeEventSubscription {
      const registration: Registration<T> = { listener };
      registrations.push(registration);
      return {
        remove() {
          registrations = registrations.filter(r => r !== registration);
        },
      };
    },
    emit(value: T) {
      [...registrations].forEach(registration => registration.listener(value));
    },
    count() {
      return registrations.length;
    },
    clear() {
      registrations = [];
    },
  };
}

const appStateEmitter = createEmitter<AppStateStatus>();
const dimensionsEmitter = createEmitter<DimensionsChange>();

let platformOS: PlatformOS = 'ios';

export const AppState = {
  addEventListener(
    type: string,
    listener: (state: AppStateStatus) => void,
  ): NativeEventSubscription {
    if (type !== 'change') {
      return { remove() {} };
    }
    return appStateEmitter.add(listener);
  },
};

export const Dimensions = {
  addEventListener(
    type: string,
    listener: (change: DimensionsChange) => void,
  ): NativeEventSubscription {
    if (type !== 'change') {
      return { remove() {} };
    }
    return dimensionsEmitter.add(listener);
  },
};

export const Platform = {
  get OS(): PlatformOS {
    return platformOS;
  },
  select<T>(spec: PlatformSelectSpec<T>): T | undefined {
    if (platformOS in spec) {
      return spec[platformOS];
    }
    if ('native' in spec) {
      return spec.native;
    }
    return spec.default;
  },
};

// —— 以下均非 react-native 真实 API,仅供测试驱动;故加 __ 前缀 ——

const DEFAULT_SIZE: ScaledSize = {
  width: 375,
  height: 812,
  scale: 3,
  fontScale: 1,
};

export function __emitAppState(state: AppStateStatus): void {
  appStateEmitter.emit(state);
}

export function __emitDimensions(
  change: DimensionsChange = { window: DEFAULT_SIZE, screen: DEFAULT_SIZE },
): void {
  dimensionsEmitter.emit(change);
}

export function __setPlatform(os: PlatformOS): void {
  platformOS = os;
}

export function __appStateListenerCount(): number {
  return appStateEmitter.count();
}

export function __dimensionsListenerCount(): number {
  return dimensionsEmitter.count();
}

export function __reset(): void {
  appStateEmitter.clear();
  dimensionsEmitter.clear();
  platformOS = 'ios';
}
