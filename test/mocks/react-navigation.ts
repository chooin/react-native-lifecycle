/**
 * @react-navigation/native 的受控替身。
 *
 * useShow / useHide 只用到 useNavigation().addListener('focus' | 'blur', cb)。
 *
 * 注意形状差异:react-navigation 的 addListener 返回的是【取消订阅函数】,
 * 而不是 RN AppState 那样的 { remove } 对象 —— 两个 hook 都直接把它作为
 * useEffect 的 cleanup 返回,替身必须匹配这个形状。
 */

type NavigationEvent = 'focus' | 'blur';

interface Registration {
  listener: () => void;
}

function createEmitter() {
  // 与 react-native.ts 的 createEmitter 同一套语义:每次注册产生独立的
  // registration,返回的取消订阅函数只摘自己那一个,而不是按引用相等过滤 ——
  // 否则同一个函数引用重复注册时,一次取消订阅会把两个都误删。
  let registrations: Array<Registration> = [];

  return {
    add(listener: () => void): () => void {
      const registration: Registration = { listener };
      registrations.push(registration);
      return () => {
        registrations = registrations.filter(r => r !== registration);
      };
    },
    emit() {
      [...registrations].forEach(registration => registration.listener());
    },
    clear() {
      registrations = [];
    },
  };
}

const emitters: Record<NavigationEvent, ReturnType<typeof createEmitter>> = {
  focus: createEmitter(),
  blur: createEmitter(),
};

// 必须是模块级单例:useShow / useHide 的 effect 依赖数组是 [navigation],
// 若每次渲染返回新对象,effect 会不断重订阅。
const navigation = {
  addListener(event: NavigationEvent, listener: () => void): () => void {
    return emitters[event].add(listener);
  },
};

export function useNavigation() {
  return navigation;
}

// —— 非真实 API,仅供测试驱动 ——

export function __emitFocus(): void {
  emitters.focus.emit();
}

export function __emitBlur(): void {
  emitters.blur.emit();
}

export function __reset(): void {
  emitters.focus.clear();
  emitters.blur.clear();
}
