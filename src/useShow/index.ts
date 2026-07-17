import { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Called when the page is displayed, or when the application switches from the background to the foreground
 * @public
 */
export function useShow(fn: () => void): void {
  const navigation = useNavigation();
  const AppStateRef = useRef<NativeEventSubscription | undefined>(undefined);
  const isAppStateChangeRef = useRef(false);

  const onChange = (state: AppStateStatus) => {
    if (isAppStateChangeRef.current) {
      if (state === 'active') {
        fn();
      }
    }
    if (
      state ===
      Platform.select({
        ios: 'inactive',
        android: 'background',
      })
    ) {
      isAppStateChangeRef.current = true;
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // focus 可能连续到达而中间没有 blur(例如条件渲染的 navigator),
      // 不先摘掉上一次的订阅就会重复挂载 —— 监听器无界增长,fn 按轮次累积触发。
      AppStateRef.current?.remove?.();
      AppStateRef.current = AppState.addEventListener('change', onChange);
    });

    return () => {
      unsubscribe();
      // 常规路径由 blur 摘除;但屏幕在 focus 状态下直接卸载时 blur 不会到来,
      // 此处兜底,否则已卸载组件的 fn 仍会被 AppState 事件触发。
      AppStateRef.current?.remove?.();
      AppStateRef.current = undefined;
    };
  }, [navigation]);

  useEffect(() => {
    return navigation.addListener('blur', () => {
      AppStateRef.current?.remove?.();
    });
  }, [navigation]);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      if (isAppStateChangeRef.current) {
        isAppStateChangeRef.current = false;
      } else {
        fn();
      }
    });
  }, [navigation]);
}
